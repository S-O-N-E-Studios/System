import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Avatar from './Avatar';

describe('Avatar', () => {
  describe('initials fallback', () => {
    it('renders initials from two-word name', () => {
      render(<Avatar name="John Doe" />);
      expect(screen.getByLabelText('John Doe')).toHaveTextContent('JD');
    });

    it('renders single initial for single name', () => {
      render(<Avatar name="Alice" />);
      expect(screen.getByLabelText('Alice')).toHaveTextContent('A');
    });

    it('renders two initials max for long names', () => {
      render(<Avatar name="John Michael Doe" />);
      expect(screen.getByLabelText('John Michael Doe')).toHaveTextContent('JM');
    });

    it('uppercases initials', () => {
      render(<Avatar name="jane smith" />);
      expect(screen.getByLabelText('jane smith')).toHaveTextContent('JS');
    });
  });

  describe('image mode', () => {
    it('renders image when src is provided', () => {
      render(<Avatar name="John Doe" src="https://example.com/avatar.jpg" />);
      const img = screen.getByAltText('John Doe');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('does not show initials when image is provided', () => {
      render(<Avatar name="John Doe" src="https://example.com/avatar.jpg" />);
      expect(screen.queryByLabelText('John Doe')).not.toBeInTheDocument();
    });
  });

  describe('size variants', () => {
    it('applies sm size classes', () => {
      render(<Avatar name="Test" size="sm" />);
      const el = screen.getByLabelText('Test');
      expect(el.className).toContain('h-6');
      expect(el.className).toContain('w-6');
    });

    it('applies md size classes by default', () => {
      render(<Avatar name="Test" />);
      const el = screen.getByLabelText('Test');
      expect(el.className).toContain('h-8');
      expect(el.className).toContain('w-8');
    });

    it('applies lg size classes', () => {
      render(<Avatar name="Test" size="lg" />);
      const el = screen.getByLabelText('Test');
      expect(el.className).toContain('h-10');
      expect(el.className).toContain('w-10');
    });

    it('applies xl size classes', () => {
      render(<Avatar name="Test" size="xl" />);
      const el = screen.getByLabelText('Test');
      expect(el.className).toContain('h-14');
      expect(el.className).toContain('w-14');
    });
  });
});
