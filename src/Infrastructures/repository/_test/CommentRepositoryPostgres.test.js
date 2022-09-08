const MockDate = require('mockdate');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');
const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const NewComment = require('../../../Domains/comments/entities/NewComment');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');

MockDate.set('2022-09-03');

describe('CommentRepositoryPostgres', () => {
  it('should be instance of ThreadRepository domain', () => {
    const commentRepositoryPostgres = new CommentRepositoryPostgres({}, {}); // Dummy dependency

    expect(commentRepositoryPostgres).toBeInstanceOf(CommentRepositoryPostgres);
  });

  describe('behavior test', () => {
    afterEach(async () => {
      await UsersTableTestHelper.cleanTable();
      await ThreadsTableTestHelper.cleanTable();
      await CommentsTableTestHelper.cleanTable();
    });

    afterAll(async () => {
      await pool.end();
    });

    describe('addComment function', () => {
      it('should persist new comment and return added comment correctly', async () => {
        await UsersTableTestHelper.addUser({
          id: 'user-123',
          username: 'dicoding',
        });
        await ThreadsTableTestHelper.addThread({
          id: 'thread-123',
          body: 'Diskusi Forum Dicoding',
          owner: 'user-123',
        });

        const newComment = new NewComment({
          content: 'komentar diskusi forum API',
          thread: 'thread-123',
          owner: 'user-123',
        });

        const fakeIdGenerator = () => '123';
        const commentRepositoryPostgres = new CommentRepositoryPostgres(
          pool,
          fakeIdGenerator,
        );

        const addedComment = await commentRepositoryPostgres.addComment(
          newComment,
        );

        const comment = await CommentsTableTestHelper.findCommentsById(
          'comment-123',
        );
        expect(addedComment).toStrictEqual(
          new AddedComment({
            id: 'comment-123',
            content: 'komentar diskusi forum API',
            owner: 'user-123',
          }),
        );
        expect(comment).toHaveLength(1);
      });
    });

    describe('verifyCommentAvailability function', () => {
      it('should throw NotFoundError if comment not available', async () => {
        // Arrange
        const commentRepositoryPostgres = new CommentRepositoryPostgres(
          pool,
          {},
        );
        const comment = 'xxx';

        // Action & Assert
        await expect(
          commentRepositoryPostgres.verifyCommentAvailability(comment),
        ).rejects.toThrow(NotFoundError);
      });

      it('should not throw NotFoundError if comment available', async () => {
        // Arrange
        const commentRepositoryPostgres = new CommentRepositoryPostgres(
          pool,
          {},
        );
        await UsersTableTestHelper.addUser({
          id: 'user-123',
          username: 'dicoding',
        });
        await ThreadsTableTestHelper.addThread({
          id: 'thread-123',
          body: 'Forum Diskusi Dicoding',
          owner: 'user-123',
        });
        await CommentsTableTestHelper.addComment({
          id: 'comment-123',
          content: 'KOmen diskusi',
          threadId: 'thread-123',
          owner: 'user-123',
        });

        // Action & Assert
        await expect(
          commentRepositoryPostgres.verifyCommentAvailability('comment-123'),
        ).resolves.not.toThrow(NotFoundError);
      });
    });

    describe('verifyCommentOwner function', () => {
      it('should throw AuthorizationError if comment not belong to owner', async () => {
        // Arrange
        const commentRepositoryPostgres = new CommentRepositoryPostgres(
          pool,
          {},
        );
        await UsersTableTestHelper.addUser({
          id: 'user-123',
          username: 'dicoding',
        });
        await UsersTableTestHelper.addUser({
          id: 'user-456',
          username: 'fitrarizki',
        });
        await ThreadsTableTestHelper.addThread({
          id: 'thread-456',
          body: 'sebuah thread',
          owner: 'user-456',
        });
        await CommentsTableTestHelper.addComment({
          id: 'comment-456',
          content: 'sebuah komentar',
          threadId: 'thread-456',
          owner: 'user-456',
        });
        const comment = 'comment-456';
        const owner = 'user-789';

        // Action & Assert
        await expect(
          commentRepositoryPostgres.verifyCommentOwner(comment, owner),
        ).rejects.toThrow(AuthorizationError);
      });

      it('should not throw AuthorizationError if comment is belongs to owner', async () => {
        // Arrange
        const commentRepositoryPostgres = new CommentRepositoryPostgres(
          pool,
          {},
        );
        await UsersTableTestHelper.addUser({
          id: 'user-456',
          username: 'fitrarizki',
        });
        await ThreadsTableTestHelper.addThread({
          id: 'thread-123',
          body: 'sebuah thread',
          owner: 'user-456',
        });
        await CommentsTableTestHelper.addComment({
          id: 'comment-123',
          content: 'sebuah komentar',
          threadId: 'thread-123',
          owner: 'user-456',
        });

        // Action & Assert
        await expect(
          commentRepositoryPostgres.verifyCommentOwner(
            'comment-123',
            'user-456',
          ),
        ).resolves.not.toThrow(AuthorizationError);
      });
    });

    describe('deleteComment', () => {
      it('should delete comment from database', async () => {
        // Arrange
        const commentRepositoryPostgres = new CommentRepositoryPostgres(
          pool,
          {},
        );
        await UsersTableTestHelper.addUser({
          id: 'user-456',
          username: 'fitrarizki',
        });
        await ThreadsTableTestHelper.addThread({
          id: 'thread-123',
          body: 'sebuah thread',
          owner: 'user-456',
        });
        await CommentsTableTestHelper.addComment({
          id: 'comment-123',
          content: 'sebuah komentar',
          threadId: 'thread-123',
          owner: 'user-456',
        });

        // Action
        await commentRepositoryPostgres.deleteComment('comment-123');

        // Assert
        const comment = await CommentsTableTestHelper.checkIsDeletedCommentsById(
          'comment-123',
        );
        expect(comment).toEqual(true);
      });
    });

    describe('getCommentsThread', () => {
      it('should get comments of thread', async () => {
        const commentRepositoryPostgres = new CommentRepositoryPostgres(
          pool,
          {},
        );
        const userPayload = { id: 'user-123', username: 'dicoding' };
        const threadPayload = {
          id: 'thread-123',
          title: 'sebuah judul thread',
          body: 'sebuah thread',
          owner: 'user-123',
        };
        const commentPayload = {
          id: 'comment-123',
          content: 'sebuah komentar',
          threadId: threadPayload.id,
          owner: userPayload.id,
        };

        await UsersTableTestHelper.addUser(userPayload);
        await ThreadsTableTestHelper.addThread(threadPayload);
        await CommentsTableTestHelper.addComment(commentPayload);

        const comments = await commentRepositoryPostgres.getCommentsThread(
          threadPayload.id,
        );

        expect(Array.isArray(comments)).toBe(true);
        expect(comments[0].id).toEqual(commentPayload.id);
        expect(comments[0].username).toEqual(userPayload.username);
        expect(comments[0].content).toEqual('sebuah komentar');
        expect(comments[0].date).toEqual(new Date().toISOString());
      });
    });
  });
});
