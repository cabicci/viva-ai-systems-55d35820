import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CurrentRagReleasePanel } from '@/components/admin/CurrentRagReleasePanel';
const state=vi.hoisted(()=>({status:vi.fn(),run:vi.fn()}));
vi.mock('@tanstack/react-start',()=>({useServerFn:(fn:unknown)=>fn}));
vi.mock('@/lib/rag-current-release.functions',()=>({getCurrentRagRelease:state.status,runCurrentRagRelease:state.run}));
const view=()=>({releaseId:'a'.repeat(64),indexVersion:'current',packages:4,chunks:20,status:{executionId:'11111111-1111-4111-8111-111111111111',
 state:'staging',completedBatches:1,totalBatches:1,providerAttempts:1,currentActiveVersion:'prior',previousVersion:null}});
beforeEach(()=>{vi.clearAllMocks();state.status.mockResolvedValue(view());state.run.mockResolvedValue({activated:true});});
describe('current release administrator controls',()=>{
 it('shows a sanitized provider limit and stops without reporting activation success',async()=>{
  state.run.mockResolvedValue({activated:false,errorCode:'CURRENT_PROVIDER_HTTP_429'});
  render(<CurrentRagReleasePanel/>);fireEvent.click(screen.getByRole('button',{name:'تحديث الحالة'}));
  fireEvent.click(await screen.findByRole('checkbox',{name:/راجعت الإصدار/}));
  fireEvent.click(screen.getByRole('button',{name:'تفعيل الإصدار المراجع'}));
  await screen.findByText(/مزود الفهرسة رفض الطلب \(429\)/);
  expect(screen.queryByText('تم تفعيل المحتوى المراجع.')).not.toBeInTheDocument();
  expect(state.run).toHaveBeenCalledTimes(1);
 });
 it('never initializes, embeds, activates or even reads status on mount',()=>{
  render(<CurrentRagReleasePanel/>);expect(state.status).not.toHaveBeenCalled();expect(state.run).not.toHaveBeenCalled();
 });
 it('requires review consent and sends the displayed active predecessor for atomic comparison',async()=>{
  render(<CurrentRagReleasePanel/>);fireEvent.click(screen.getByRole('button',{name:'تحديث الحالة'}));
  const activate=await screen.findByRole('button',{name:'تفعيل الإصدار المراجع'});expect(activate).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox',{name:/راجعت الإصدار/}));fireEvent.click(activate);
  await waitFor(()=>expect(state.run).toHaveBeenCalledTimes(1));
  expect(state.run).toHaveBeenCalledWith({data:expect.objectContaining({operation:'activate',releaseId:'a'.repeat(64),expectedActiveVersion:'prior'})});
 });
 it('clears prior consent after refreshed status, and disables paid preparation for complete content',async()=>{
  render(<CurrentRagReleasePanel/>);fireEvent.click(screen.getByRole('button',{name:'تحديث الحالة'}));
  const consent=await screen.findByRole('checkbox',{name:/راجعت الإصدار/});fireEvent.click(consent);expect(consent).toBeChecked();
  fireEvent.click(screen.getByRole('button',{name:'تحديث الحالة'}));await waitFor(()=>expect(consent).not.toBeChecked());
  expect(screen.getByRole('button',{name:'تجهيز التحديث أو استكماله'})).toBeDisabled();
 });
 it('stops on an uncertain action response instead of automatically repeating an activation',async()=>{
  state.run.mockRejectedValue(new Error('lost response'));
  render(<CurrentRagReleasePanel/>);fireEvent.click(screen.getByRole('button',{name:'تحديث الحالة'}));
  fireEvent.click(await screen.findByRole('checkbox',{name:/راجعت الإصدار/}));
  fireEvent.click(screen.getByRole('button',{name:'تفعيل الإصدار المراجع'}));
  await screen.findByText(/لم يتم تشغيل إعادة محاولة تلقائية/);expect(state.run).toHaveBeenCalledTimes(1);
 });
});
