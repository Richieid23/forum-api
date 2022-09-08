const DetailThread = require('../../Domains/threads/entities/DetailThread');
const DetailComment = require('../../Domains/comments/entities/DetailComment');

class DetailThreadUseCase {
  constructor({ threadRepository, commentRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(useCasePayload) {
    const { threadId } = useCasePayload;
    await this._threadRepository.verifyThreadAvailability(threadId);
    const detailThread = await this._threadRepository.getDetailThread(threadId);
    const getCommentsThread = await this._commentRepository.getCommentsThread(
      threadId,
    );
    const getCommentsThreadMapped = this._remappingPayload(getCommentsThread);
    detailThread.comments = [];
    for (let i = 0; i < getCommentsThreadMapped.length; i += 1) {
      detailThread.comments.push(getCommentsThreadMapped[i]);
    }
    return {
      thread: detailThread,
    };
  }

  _remappingPayload(comments) {
    return comments.map((comment) => ({
      id: comment.id,
      username: comment.username,
      date: comment.date,
      content: comment.is_deleted
        ? '**komentar telah dihapus**'
        : comment.content,
    }));
  }
}

module.exports = DetailThreadUseCase;
