// Two explicitly owner-reviewed DB-only transfer recoveries. No automatic loop or provider retry.
export const FIXED_RECOVERY = Object.freeze({
 executionId:"6773665d-76b3-49cc-977b-26418f78cad3",
 priorRequestId:"723d4cab-d7fd-4164-8f6f-74dca6e06fee",
 nextRequestId:"23b16873-4ad5-4c91-a22d-66e8ec94671b",
 ordinal:4,
 priorHistoryLength:0,
 priorLeaseMd5:"e6a13a5772360d0b69d7f12cd7743e3a",
 priorRequestMd5:"b88ee208ccc2efdff1a18dd97f242448",
 priorCheckpointSha256:"133492e6f2b54923190dd82f09af4c304af805afc8b5ee504eb50ed08fac0b0e",
 legacyAuditMd5:"1cd729044620ec9c1fd475fb36271085",
 artifactSha256:"c468922fe7b26a331caae8999cb28777b769eda73a3471a337a7f6ddc021f7f8",
});
export const RECOVERY_CASES = Object.freeze([FIXED_RECOVERY,Object.freeze({
 executionId:"6773665d-76b3-49cc-977b-26418f78cad3",
 priorRequestId:"f6214b00-99f5-4cbf-a3b9-08354984ec4e",
 nextRequestId:"b9e60db6-0f0f-4cca-a445-275b6a551209",
 ordinal:5,
 priorHistoryLength:1,
 priorLeaseMd5:"edf29b03c6a18b4ee00d880799ac4973",
 priorRequestMd5:"c2db3d4ccaa8524fb5bc5ead138cc0db",
 priorCheckpointSha256:"491e6408326b2b56aff760b9f5fad5a03f9b66689eb56ef18ced4fd1a8d46daf",
 legacyAuditMd5:"1cd729044620ec9c1fd475fb36271085",
 artifactSha256:"c468922fe7b26a331caae8999cb28777b769eda73a3471a337a7f6ddc021f7f8",
})]);
