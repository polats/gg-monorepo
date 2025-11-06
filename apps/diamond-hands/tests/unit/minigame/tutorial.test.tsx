import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Tutorial } from '@/components/minigame/Tutorial';

describe('Tutorial Component', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tutorial Flow', () => {
    it('should render the first slide on mount', () => {
      render(<Tutorial onComplete={mockOnComplete} />);

      expect(screen.getByText(/Welcome to Diamond Hands/i)).toBeInTheDocument();
      expect(screen.getByText(/Skip/i)).toBeInTheDocument();
      expect(screen.getByText(/Next/i)).toBeInTheDocument();
    });

    it('should progress through slides when clicking Next', () => {
      render(<Tutorial onComplete={mockOnComplete} />);

      const nextButton = screen.getByText(/Next/i);

      // Go to second slide
      fireEvent.click(nextButton);
      expect(screen.getByText(/How to Play/i)).toBeInTheDocument();

      // Go to third slide
      fireEvent.click(nextButton);
      expect(screen.getByText(/Ready to Start/i)).toBeInTheDocument();
      expect(screen.getByText(/Get Started/i)).toBeInTheDocument();
    });

    it('should call onComplete when clicking Skip', () => {
      render(<Tutorial onComplete={mockOnComplete} />);

      const skipButton = screen.getByText(/Skip/i);
      fireEvent.click(skipButton);

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    it('should call onComplete when clicking Get Started on last slide', () => {
      render(<Tutorial onComplete={mockOnComplete} />);

      const nextButton = screen.getByText(/Next/i);

      // Navigate to last slide
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      const getStartedButton = screen.getByText(/Get Started/i);
      fireEvent.click(getStartedButton);

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Visual Elements', () => {
    it('should display progress indicators', () => {
      render(<Tutorial onComplete={mockOnComplete} />);

      const progressDots = screen.getAllByTestId(/progress-dot/i);
      expect(progressDots).toHaveLength(3);
      expect(progressDots[0]).toHaveClass('active');
    });

    it('should update progress indicators when navigating', () => {
      render(<Tutorial onComplete={mockOnComplete} />);

      const nextButton = screen.getByText(/Next/i);
      fireEvent.click(nextButton);

      const progressDots = screen.getAllByTestId(/progress-dot/i);
      expect(progressDots[1]).toHaveClass('active');
    });
  });
});