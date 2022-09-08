const MockDate = require('mockdate');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const pool = require('../../database/postgres/pool');
const NewThread = require('../../../Domains/threads/entities/NewThread');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const AddedThread = require('../../../Domains/threads/entities/AddedThread');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

MockDate.set('2022-09-03');

describe('ThreadRepositoryPostgres', () => {
  it('should be instance of ThreadRepository domain', () => {
    const threadRepositoryPostgres = new ThreadRepositoryPostgres({}, {}); // Dummy dependency

    expect(threadRepositoryPostgres).toBeInstanceOf(ThreadRepository);
  });

  describe('behavior test', () => {
    afterEach(async () => {
      await ThreadsTableTestHelper.cleanTable();
      await UsersTableTestHelper.cleanTable();
    });

    afterAll(async () => {
      await pool.end();
    });

    describe('addThread function', () => {
      it('should persist new thread and return added thread correctly', async () => {
        await UsersTableTestHelper.addUser({
          id: 'user-123',
          username: 'fitrarizki',
        });

        const newThread = new NewThread({
          title: 'Forum Diskusi Dicoding',
          body: 'Open diskusi forum API Dicoding Indonesia',
          owner: 'user-123',
        });

        const fakeIdGenerator = () => '123';
        const threadRepositoryPostgres = new ThreadRepositoryPostgres(
          pool,
          fakeIdGenerator,
        );

        const addedThread = await threadRepositoryPostgres.addThread(newThread);

        const thread = await ThreadsTableTestHelper.findThreadById(
          'thread-123',
        );
        expect(addedThread).toStrictEqual(
          new AddedThread({
            id: 'thread-123',
            title: 'Forum Diskusi Dicoding',
            owner: 'user-123',
          }),
        );
        expect(thread).toHaveLength(1);
      });
    });

    describe('verifyThreadAvailability function', () => {
      it('should throw NotFoundError if thread not available', async () => {
        // Arrange
        const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});
        const threadId = 'xxx';

        // Action & Assert
        await expect(
          threadRepositoryPostgres.verifyThreadAvailability(threadId),
        ).rejects.toThrow(NotFoundError);
      });

      it('should not throw NotFoundError if thread available', async () => {
        // Arrange
        const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});
        await UsersTableTestHelper.addUser({
          id: 'user-123',
          username: 'fitrarizki',
        });
        await ThreadsTableTestHelper.addThread({
          id: 'thread-123',
          body: 'Forum Diskusi Dicoding',
          owner: 'user-123',
        });

        // Action & Assert
        await expect(
          threadRepositoryPostgres.verifyThreadAvailability('thread-123'),
        ).resolves.not.toThrow(NotFoundError);
      });
    });

    describe('getDetailThread function', () => {
      it('should get detail thread', async () => {
        const threadRepository = new ThreadRepositoryPostgres(pool, {});
        const userPayload = { id: 'user-123', username: 'fitrarizki' };
        const threadPayload = {
          id: 'thread-123',
          title: 'Forum Diskusi Dicoding',
          body: 'Open diskusi forum',
          owner: 'user-123',
        };
        await UsersTableTestHelper.addUser(userPayload);
        await ThreadsTableTestHelper.addThread(threadPayload);
        const detailThread = await threadRepository.getDetailThread(
          threadPayload.id,
        );

        expect(detailThread.id).toEqual(threadPayload.id);
        expect(detailThread.title).toEqual(threadPayload.title);
        expect(detailThread.body).toEqual(threadPayload.body);
        expect(detailThread.username).toEqual(userPayload.username);
        expect(detailThread.date).toEqual(new Date().toISOString());
      });
    });
  });
});
