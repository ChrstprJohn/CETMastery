const sample = {
  id: 'linear-equations-01',
  subject: 'Mathematics',
  topic: 'Linear equations',
  prompt: 'If 3x + 7 = 22, what is x?',
  options: [
    { id: 'a', label: '3' },
    { id: 'b', label: '5' },
    { id: 'c', label: '7' },
    { id: 'd', label: '9' },
  ],
};

export function getSampleQuestion() {
  return sample;
}

export function scoreSample(questionId, optionId) {
  if (questionId !== sample.id || !sample.options.some((option) => option.id === optionId)) return null;
  return {
    correct: optionId === 'b',
    correctOptionId: 'b',
    explanation: 'Subtract 7 from both sides: 3x = 15. Then divide both sides by 3, so x = 5.',
  };
}
