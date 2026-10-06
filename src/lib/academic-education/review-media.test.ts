import {describe, expect, it} from 'vitest';
import {resolveReviewMedia} from '../../../experiments/academic/review-media';

const lessonId='AC-BUS-M01-L02', locale='en';
const entry={lessonId,locale,playbackReady:true,durationSeconds:120,
  embedUrl:'https://iframe.mediadelivery.net/embed/1/11111111-1111-4111-8111-111111111111?autoplay=false&preload=false'};
const registry={ [`${lessonId}__${locale}`]:entry };
describe('exact Academic review video lookup',()=>{
  it('resolves a ready exact lesson without pilot fallback',()=>{
    expect(resolveReviewMedia(registry,lessonId,locale)?.embedUrl).toBe(entry.embedUrl);
    expect(resolveReviewMedia(registry,'AC-BUS-M01-L03',locale)).toBeNull();
    expect(resolveReviewMedia(registry,lessonId,'ar-EG')).toBeNull();
  });
  it('rejects wrong identities, unready and unsafe URLs',()=>{
    for(const change of [{locale:'ar-EG'},{lessonId:'other'},{playbackReady:false},{durationSeconds:0},
      {embedUrl:entry.embedUrl.replace('autoplay=false','autoplay=true')},{embedUrl:'https://example.com/video'}]){
      expect(resolveReviewMedia({[`${lessonId}__${locale}`]:{...entry,...change}},lessonId,locale)).toBeNull();
    }
  });
});
