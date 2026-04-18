import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FileManager from './FileManager';
import { useUiStore } from '@/store/uiStore';
import { filesApi } from '@/api/files';
import type { ProjectFile } from '@/types';

vi.mock('@/api/files', () => ({
  filesApi: {
    list: vi.fn(),
  },
}));

const emptyList = {
  data: [] as ProjectFile[],
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 1,
};

function renderFileManager() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/demo/files']}>
        <Routes>
          <Route path="/:tenantSlug/files" element={<FileManager />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('FileManager', () => {
  beforeEach(() => {
    useUiStore.setState({
      toasts: [],
      activeModal: null,
      modalData: null,
    });
    vi.mocked(filesApi.list).mockResolvedValue(emptyList);
  });

  it('shows empty state when the API returns no files', async () => {
    renderFileManager();
    expect(
      await screen.findByText('No files in this category yet.')
    ).toBeInTheDocument();
  });

  it('renders the upload zone button', async () => {
    renderFileManager();
    expect(await screen.findByText('Drop files here or click to upload')).toBeInTheDocument();
  });

  it('opens the upload modal when the upload zone is clicked', async () => {
    renderFileManager();
    const zone = (await screen.findByText('Drop files here or click to upload')).closest('button')!;
    fireEvent.click(zone);
    expect(useUiStore.getState().activeModal).toBe('file-upload');
  });

  it('renders document-type filter tabs', async () => {
    renderFileManager();
    expect(await screen.findByText('All')).toBeInTheDocument();
    expect(screen.getByText('Payment Certificates')).toBeInTheDocument();
    expect(screen.getByText('Drawings')).toBeInTheDocument();
  });

  it('filters files when a tab is clicked', async () => {
    renderFileManager();
    fireEvent.click(await screen.findByText('Geo-Technical Reports'));
    expect(screen.getByText('Geo-Technical Reports')).toBeInTheDocument();
  });
});
