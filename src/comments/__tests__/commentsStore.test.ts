import { useComments, type Comment } from '../commentsStore';

const comment = (id: string, cardId: string, authorId: string): Comment => ({
  id,
  cardId,
  authorId,
  authorName: authorId,
  body: 'hi',
  createdAt: 0,
});

describe('hiding comments after a report or block', () => {
  beforeEach(() => {
    useComments.setState({
      counts: { c1: 3, c2: 1 },
      threads: {
        c1: { status: 'ready', items: [comment('a', 'c1', 'u1'), comment('b', 'c1', 'u2'), comment('c', 'c1', 'u1')] },
        c2: { status: 'ready', items: [comment('d', 'c2', 'u1')] },
      },
    });
  });

  it('drops one reported comment and its count', () => {
    useComments.getState().hide((c) => c.id === 'b');
    const { threads, counts } = useComments.getState();
    expect(threads.c1.items.map((c) => c.id)).toEqual(['a', 'c']);
    expect(counts.c1).toBe(2);
    expect(counts.c2).toBe(1);
  });

  it('drops every comment by a blocked person, across cards', () => {
    useComments.getState().hide((c) => c.authorId === 'u1');
    const { threads, counts } = useComments.getState();
    expect(threads.c1.items.map((c) => c.id)).toEqual(['b']);
    expect(threads.c2.items).toEqual([]);
    expect(counts).toEqual({ c1: 1, c2: 0 });
  });

  it('never drives a count below zero', () => {
    useComments.setState({ counts: {} });
    useComments.getState().hide(() => true);
    expect(useComments.getState().counts.c1).toBe(0);
  });
});
