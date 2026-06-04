import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page at root', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
});
