import { useEffect, useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { api } from '../lib/api.js';

export default function PracticeQuestion() {
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    api.get('/practice/question', { signal: controller.signal })
      .then(({ data }) => setQuestion(data.data))
      .catch((err) => {
        if (err.code !== 'ERR_CANCELED') setError('The question could not load. Please try again.');
      });
    return () => controller.abort();
  }, [retry]);

  async function submit(event) {
    event.preventDefault();
    if (!selected || busy) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/practice/answer', { questionId: question.id, optionId: selected });
      setResult(data.data);
    } catch {
      setError('Your answer could not be checked. Please try again.');
    } finally { setBusy(false); }
  }

  return <div className="practice-sheet" data-ui>
    <div className="sheet-top"><span>Mathematics</span><span>Sample practice</span></div>
    {!question ? <div className="question-loading" aria-live="polite">
      <p>{error || 'Loading your question…'}</p>
      {error && <button className="text-button" onClick={() => setRetry(retry + 1)}>Try again</button>}
    </div> : <form onSubmit={submit}>
      <fieldset disabled={busy || Boolean(result)}>
        <legend>{question.prompt}</legend>
        <p className="question-hint">Take your time. Choose one answer.</p>
        <div className="answer-options">
          {question.options.map((option) => <label key={option.id} className={`answer-option${selected === option.id ? ' selected' : ''}${result?.correctOptionId === option.id ? ' correct' : ''}`}>
            <input type="radio" name="answer" value={option.id} checked={selected === option.id} onChange={() => setSelected(option.id)} />
            <span className="option-letter">{option.id.toUpperCase()}</span><span>{option.label}</span>
            {result?.correctOptionId === option.id && <Check size={19} aria-label="Correct answer" />}
          </label>)}
        </div>
      </fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
      {result ? <div className="answer-feedback" role="status">
        <strong>{result.correct ? 'You’ve got it.' : 'A little practice goes a long way.'}</strong>
        <p>{result.explanation}</p>
        <button type="button" className="text-button" onClick={() => { setSelected(''); setResult(null); }}><RotateCcw size={16} aria-hidden="true" /> Try again</button>
      </div> : <button className="button button-dark check-answer" type="submit" disabled={!selected || busy}>{busy ? 'Checking…' : 'Check my answer'}</button>}
    </form>}
    <p className="sheet-note">Just a taster. No account needed. Progress isn’t saved.</p>
  </div>;
}
