import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {LocaleProvider} from '@/lib/locale/locale-context';
import {getUiString} from '@/lib/locale/ui-strings';
import {DifficultyPrompt} from './DifficultyPrompt';
import type {ComponentProps} from 'react';
const events=vi.hoisted(()=>({log:vi.fn()}));
vi.mock('@/lib/learner-events',()=>({logLearnerEvent:events.log}));
const base:ComponentProps<typeof DifficultyPrompt>={lessonId:'synthetic-lesson-3',pathId:'synthetic-path',moduleId:'synthetic-module',completedCount:3,isCompleted:true,nextLessonHref:'/learn/synthetic/lesson-4'};
beforeEach(()=>{localStorage.clear();vi.clearAllMocks();});afterEach(()=>{cleanup();vi.restoreAllMocks();});
function setup(locale:'en'|'ar-EG'|'ar-MSA'|'ar-Gulf'='en',props=base){
 const view=(p=props)=><LocaleProvider initialLocale={locale}><DifficultyPrompt {...p}/></LocaleProvider>;
 const result=render(view());return {...result,rerenderLesson:(p:typeof base)=>result.rerender(view(p)),copy:(k:'hard'|'ok'|'easy'|'close'|'hardTitle'|'hardBody'|'easyTitle'|'easyCta')=>getUiString(locale,`learn.difficulty.${k}`)};
}
describe('difficulty selection and post-answer guidance',()=>{
 it.each(['en','ar-EG','ar-MSA','ar-Gulf'] as const)('keeps hard advice visible after selecting in %s without showing another survey',locale=>{
  const {copy}=setup(locale);fireEvent.click(screen.getByRole('button',{name:copy('hard')}));
  expect(screen.getByRole('status')).toHaveTextContent(copy('hardTitle'));expect(screen.getByRole('status')).toHaveTextContent(copy('hardBody'));
  expect(screen.queryByRole('button',{name:copy('easy')})).toBeNull();expect(events.log).toHaveBeenCalledTimes(1);
  expect(events.log).toHaveBeenCalledWith(expect.objectContaining({lessonId:base.lessonId,metadata:{rating:'hard',completedCount:3}}));
  expect(localStorage.getItem('lovable.difficulty.'+base.lessonId)).toBe('hard');
 });
 it.each(['en','ar-EG','ar-MSA','ar-Gulf'] as const)('retains the easy guidance link in %s',locale=>{
  const {copy}=setup(locale);fireEvent.click(screen.getByRole('button',{name:copy('easy')}));
  expect(screen.getByRole('status')).toHaveTextContent(copy('easyTitle'));expect(screen.getByRole('link',{name:copy('easyCta')})).toHaveAttribute('href',base.nextLessonHref);
 });
 it('records the middle answer and closes a survey with no guidance',()=>{
  const {copy}=setup();fireEvent.click(screen.getByRole('button',{name:copy('ok')}));expect(screen.queryByRole('status')).toBeNull();expect(screen.queryByRole('button')).toBeNull();expect(events.log).toHaveBeenCalledTimes(1);
 });
 it('does not leave a blank card for easy rating with no next lesson',()=>{
  const {copy}=setup('en',{...base,nextLessonHref:undefined});fireEvent.click(screen.getByRole('button',{name:copy('easy')}));expect(screen.queryByRole('button')).toBeNull();expect(screen.queryByRole('link')).toBeNull();
 });
 it('keeps selected advice open when the same lesson checkpoint count changes',()=>{
  const {copy,rerenderLesson}=setup();fireEvent.click(screen.getByRole('button',{name:copy('hard')}));
  rerenderLesson({...base,completedCount:4});expect(screen.getByRole('status')).toHaveTextContent(copy('hardTitle'));
  fireEvent.click(screen.getByRole('button',{name:copy('close')}));rerenderLesson({...base,completedCount:6});expect(screen.queryByRole('status')).toBeNull();expect(screen.queryByRole('button')).toBeNull();expect(events.log).toHaveBeenCalledTimes(1);
 });
 it('does not leave a blank card when an active easy guidance link becomes unavailable',()=>{
  const {copy,rerenderLesson}=setup();fireEvent.click(screen.getByRole('button',{name:copy('easy')}));
  rerenderLesson({...base,nextLessonHref:undefined,completedCount:4});expect(screen.queryByRole('status')).toBeNull();expect(screen.queryByRole('button')).toBeNull();expect(events.log).toHaveBeenCalledTimes(1);
 });
 it('dismisses guidance, persists dismissal and does not log a second rating',()=>{
  const {copy,unmount}=setup();fireEvent.click(screen.getByRole('button',{name:copy('hard')}));fireEvent.click(screen.getByRole('button',{name:copy('close')}));
  expect(screen.queryByRole('status')).toBeNull();expect(localStorage.getItem('lovable.difficulty.'+base.lessonId)).toBe('dismissed');unmount();setup();expect(screen.queryByRole('button')).toBeNull();expect(events.log).toHaveBeenCalledTimes(1);
 });
 it.each(['hard','ok','easy','dismissed'])('saved %s response suppresses another survey and transient guidance',rating=>{
  localStorage.setItem('lovable.difficulty.'+base.lessonId,rating);setup();expect(screen.queryByRole('button')).toBeNull();expect(screen.queryByRole('status')).toBeNull();expect(events.log).not.toHaveBeenCalled();
 });
 it('leaving the lesson clears transient advice and allows the next eligible survey',()=>{
  const {copy,rerenderLesson}=setup();fireEvent.click(screen.getByRole('button',{name:copy('hard')}));rerenderLesson({...base,lessonId:'synthetic-lesson-6',completedCount:6});
  expect(screen.queryByRole('status')).toBeNull();expect(screen.getByRole('button',{name:copy('hard')})).toBeInTheDocument();expect(events.log).toHaveBeenCalledTimes(1);
 });
 it('ignores malformed saved values and retains guidance if local storage is unavailable',()=>{
  localStorage.setItem('lovable.difficulty.'+base.lessonId,'unexpected');const {copy}=setup();
  vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('unavailable');});fireEvent.click(screen.getByRole('button',{name:copy('hard')}));expect(screen.getByRole('status')).toHaveTextContent(copy('hardTitle'));
 });
 it.each([{isCompleted:false,completedCount:3},{isCompleted:true,completedCount:0},{isCompleted:true,completedCount:4}])('does not create a survey outside checkpoint eligibility %j',condition=>{
  setup('en',{...base,...condition});expect(screen.queryByRole('button')).toBeNull();expect(events.log).not.toHaveBeenCalled();
 });
});
