// A8 Context.
import { makeBank } from './_util.js';

const KINDS = [['the instruments that existed and the styles current at the time', 'Historical'], ['whether the music was for dancing, church, a concert or a film', 'Social'], ['the tradition the music belongs to and what it borrows from others', 'Cultural'], ['the year the piece was written and what had just been invented', 'Historical'], ['who the audience was and where they heard it', 'Social'], ['the blend of African American rhythm and European harmony in ragtime', 'Cultural']];
const templates = [
  (r) => { const [d, k] = r.pick(KINDS); return { text: `Which kind of context is this: ${d}?`, correct: k, wrong: ['Historical', 'Social', 'Cultural', 'Personal'].filter(x => x !== k).slice(0, 3), explain: `${k} context.` }; },
  (r) => {
    const q = r.pick([
      { text: 'When was Maple Leaf Rag published?', correct: '1899', wrong: ['1850', '1924', '1950'] },
      { text: 'Ragtime was mainly', correct: 'piano music sold as sheet music for home and bar pianists', wrong: ['orchestral music for concert halls', 'church music', 'film music'] },
      { text: 'Rhapsody in Blue (1924) brought', correct: 'jazz rhythms and blue notes into a concert piece for piano and orchestra', wrong: ['waltz rhythms into jazz', 'chant into opera', 'rock into ballet'] },
      { text: 'The Blue Danube was written for', correct: 'dancing in the ballrooms of Vienna', wrong: ['a church service', 'a film', 'a military parade'] },
      { text: 'Why is The Blue Danube in 3/4?', correct: 'Because the waltz is a dance with one turn per three-beat bar', wrong: ['Because Strauss could not write in 4/4', 'Because the orchestra was small', 'Because it was played at night'] },
      { text: 'Für Elise was written for', correct: 'an amateur to play at home on a piano', wrong: ['a large public concert', 'a cathedral choir', 'a film score'] },
      { text: 'Beethoven\'s Fifth Symphony was first performed', correct: 'in Vienna in 1808, to a paying public audience', wrong: ['in a private home in 1750', 'in Paris in 1900', 'on the radio in 1930'] },
      { text: 'Why did Saint-Saëns keep The Carnival of the Animals unpublished in his lifetime?', correct: 'He thought it too light and feared it would harm his reputation', wrong: ['It was unfinished', 'It was banned', 'He lost the manuscript'] },
      { text: 'A context fact is useful in a response when', correct: 'it explains something you can hear in the music', wrong: ['it is interesting', 'it is about the composer\'s childhood', 'it fills space'] },
      { text: 'Which sentence uses context well?', correct: 'Written for dancing, so the 3/4 metre and oom-pah-pah accompaniment never change.', wrong: ['Strauss was born in 1825.', 'The piece is very famous.', 'Vienna is the capital of Austria.'] },
      { text: 'Which three facts should you find for each of your own works?', correct: 'When and where it was written, what it was for, and one thing about the composer or performer that shaped it', wrong: ['Its length, its key and its tempo', 'The price of the sheet music, the publisher and the edition', 'The composer\'s parents, siblings and pets'] },
      { text: 'What does context explain about a piece?', correct: 'Choices that would otherwise seem arbitrary, such as the metre or the instruments', wrong: ['The exact notes', 'How to play the instrument', 'Nothing'] },
      { text: 'What was once thought improper about the waltz?', correct: 'The partners held each other while dancing', wrong: ['It was too slow', 'It was sung in Latin', 'It used drums'] },
      { text: 'When was Für Elise published?', correct: '1867, long after it was written', wrong: ['1810, when it was written', '1750', '1924'] },
      { text: 'Which feature of ragtime did jazz take over?', correct: 'Syncopation against a steady beat', wrong: ['The waltz rhythm', 'The use of a choir', 'The lack of a beat'] },
      { text: 'Where was Rhapsody in Blue first performed?', correct: 'In a concert in New York', wrong: ['In a church in Vienna', 'In a Paris ballroom', 'On a film set'] },
      { text: 'What does the oom-pah-pah accompaniment of a waltz put on beat 1?', correct: 'The bass note', wrong: ['A chord', 'A rest', 'The melody only'] },
      { text: 'What size of audience was Beethoven\'s Fifth written to reach?', correct: 'A large public concert hall', wrong: ['A single listener at home', 'A small chapel choir', 'A radio audience'] },
      { text: 'What kind of occasion was The Carnival of the Animals written for?', correct: 'A private concert among friends', wrong: ['A royal coronation', 'A public festival', 'A film premiere'] },
      { text: 'Which of these is social context?', correct: 'The piece was written for dancing', wrong: ['The piece is in G major', 'The piece has three sections', 'The piece uses an oboe'] },
      { text: 'Which of these is historical context?', correct: 'The piano had just become common in middle-class homes', wrong: ['The texture is homophonic', 'The dynamics are soft', 'The piece is a rondo'] },
    ]);
    return { ...q, wrong: q.wrong.slice(), explain: q.correct + '.' };
  },
  (r) => {
    const pairs = [['Maple Leaf Rag', 'Scott Joplin, 1899, Missouri'], ['Rhapsody in Blue', 'George Gershwin, 1924, New York'], ['The Blue Danube', 'Johann Strauss II, 1867, Vienna'], ['Symphony No. 5', 'Beethoven, 1808, Vienna'], ['The Carnival of the Animals', 'Saint-Saëns, 1886, a private concert for friends']];
    const [w, c] = r.pick(pairs);
    return { text: `Match the work to its context: ${w}.`, correct: c, wrong: r.shuffle(pairs.filter(x => x[1] !== c).map(x => x[1])).slice(0, 3), explain: `${w}: ${c}.` };
  },
];
export function bank(unit = 1, seed = 28) { return makeBank(templates, unit, seed, 32); }
export const meta = { code: 'A8', quizLength: 10, passMark: 70 };
