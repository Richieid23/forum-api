const NewComment = require('../NewComment');

describe('AddComment entities', () => {
  it('should throw error when payload did not contain needed property', () => {
    const payload = {
      content: 'diskusi forum api',
      threadId: 'thread-123,',
    };

    expect(() => new NewComment(payload)).toThrowError('NEW_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    const payload = {
      thread: {},
      owner: 123,
      content: [],
    };

    expect(() => new NewComment(payload)).toThrowError('NEW_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create new comment object correctly', () => {
    const payload = {
      thread: 'thread-123',
      owner: 'user-123',
      content: 'diskusi forum api',
    };

    const newComment = new NewComment(payload);

    expect(newComment.content).toEqual(payload.content);
    expect(newComment.thread).toEqual(payload.thread);
    expect(newComment.owner).toEqual(payload.owner);
  });
});
