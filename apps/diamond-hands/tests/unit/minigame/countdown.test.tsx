import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CircularCountdown } from '@/components/minigame/CircularCountdown';

jest.useFakeTimers();

describe('CircularCountdown Component', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Countdown Behavior', () => {
    it('should start at the specified duration', () => {
      render(
        <CircularCountdown
          duration={5}
          isActive={true}
          onComplete={mockOnComplete}
        />
      );

      const progressCircle = screen.getByTestId('countdown-progress');
      expect(progressCircle).toHaveAttribute('stroke-dashoffset', '0');
    });

    it('should update progress over time', () => {
      render(
        <CircularCountdown
          duration={5}
          isActive={true}
          onComplete={mockOnComplete}
        />
      );

      act(() => {
        jest.advanceTimersByTime(2500); // Half way through
      });

      const progressCircle = screen.getByTestId('countdown-progress');
      const dashOffset = progressCircle.getAttribute('stroke-dashoffset');
      expect(Number(dashOffset)).toBeGreaterThan(0);
    });

    it('should call onComplete when countdown finishes', () => {
      render(
        <CircularCountdown
          duration={5}
          isActive={true}
          onComplete={mockOnComplete}
        />
      );

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    it('should stop countdown when isActive becomes false', () => {
      const { rerender } = render(
        <CircularCountdown
          duration={5}
          isActive={true}
          onComplete={mockOnComplete}
        />
      );

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      rerender(
        <CircularCountdown
          duration={5}
          isActive={false}
          onComplete={mockOnComplete}
        />
      );

      act(() => {
        jest.advanceTimersByTime(3000); // Complete the original duration
      });

      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });

  describe('Visual Properties', () => {
    it('should render with correct size', () => {
      render(
        <CircularCountdown
          duration={5}
          isActive={true}
          onComplete={mockOnComplete}
          size={100}
        />
      );

      const svg = screen.getByTestId('countdown-svg');
      expect(svg).toHaveAttribute('width', '100');
      expect(svg).toHaveAttribute('height', '100');
    });

    it('should use red color for the progress stroke', () => {
      render(
        <CircularCountdown
          duration={5}
          isActive={true}
          onComplete={mockOnComplete}
        />
      );

      const progressCircle = screen.getByTestId('countdown-progress');
      expect(progressCircle).toHaveClass('stroke-red-500');
    });

    it('should animate smoothly with transition', () => {
      render(
        <CircularCountdown
          duration={5}
          isActive={true}
          onComplete={mockOnComplete}
        />
      );

      const progressCircle = screen.getByTestId('countdown-progress');
      expect(progressCircle).toHaveStyle({ transition: expect.stringContaining('stroke-dashoffset') });
    });
  });

  describe('Reset Behavior', () => {
    it('should reset when key prop changes', () => {
      const { rerender } = render(
        <CircularCountdown
          duration={5}
          isActive={true}
          onComplete={mockOnComplete}
          key="countdown-1"
        />
      );

      act(() => {
        jest.advanceTimersByTime(2500);
      });

      rerender(
        <CircularCountdown
          duration={5}
          isActive={true}
          onComplete={mockOnComplete}
          key="countdown-2"
        />
      );

      const progressCircle = screen.getByTestId('countdown-progress');
      expect(progressCircle).toHaveAttribute('stroke-dashoffset', '0');
    });
  });
});