import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { KillCounter } from '../components/HUD/KillCounter';

describe('KillCounter', () => {
  it('renders correct kill count', () => {
    const { container } = render(<KillCounter kills={5} />);
    expect(container).toHaveTextContent('KILLS: 5');
  });

  it('renders zero kills', () => {
    const { container } = render(<KillCounter kills={0} />);
    expect(container).toHaveTextContent('KILLS: 0');
  });
});
