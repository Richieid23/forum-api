const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const DetailThreadUseCase = require('../DetailThreadUseCase');

describe('DetailThreadUseCase', () => {
  it('should get return detail thread correctly', async () => {
    const useCasePayload = {
      threadId: 'thread-123',
      title: 'Forum API Dicoding Indonesia',
      body: 'Diskusi forum API disini',
      date: '2022-08-31 04.00',
      username: 'dicoding',
      comments: [],
    };

    const expectedThread = {
      id: 'thread-123',
      title: 'Forum API Dicoding Indonesia',
      body: 'Diskusi forum API disini',
      date: '2022-08-31 04.00',
      username: 'dicoding',
      comments: [],
    };

    const expectedComment = [
      {
        id: 'comment-123',
        username: 'dicoding',
        date: '2022-08-31 14.00',
        content: 'komen diskusi forum API',
        is_deleted: 0,
      },
      {
        id: 'comment-123',
        username: 'fitrarizki',
        date: '2022-08-31 14.00',
        content: 'komen kedua diskusi forum API',
        is_deleted: 1,
      },
    ];

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    mockThreadRepository.verifyThreadAvailability = jest.fn(() => Promise.resolve());
    mockThreadRepository.getDetailThread = jest.fn()
      .mockImplementation(() => Promise.resolve(expectedThread));
    mockCommentRepository.getCommentsThread = jest.fn()
      .mockImplementation(() => Promise.resolve(expectedComment));

    const detailThreadUseCase = new DetailThreadUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    const detailThread = await detailThreadUseCase.execute(useCasePayload);

    expect(mockThreadRepository.getDetailThread).toHaveBeenCalledWith(
      useCasePayload.threadId,
    );
    expect(mockCommentRepository.getCommentsThread).toHaveBeenCalledWith(
      useCasePayload.threadId,
    );
    expect(detailThread).toStrictEqual({
      thread: {
        id: 'thread-123',
        title: 'Forum API Dicoding Indonesia',
        body: 'Diskusi forum API disini',
        date: '2022-08-31 04.00',
        username: 'dicoding',
        comments: [
          {
            id: 'comment-123',
            username: 'dicoding',
            date: '2022-08-31 14.00',
            content: 'komen diskusi forum API',
          },
          {
            id: 'comment-123',
            username: 'fitrarizki',
            date: '2022-08-31 14.00',
            content: '**komentar telah dihapus**',
          },
        ],
      },
    });
  });
});
