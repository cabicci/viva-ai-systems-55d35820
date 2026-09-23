// Preview build only. Shared QuizBlock runs without an authenticated learner.
// Never imported by the platform application or used for authorization.
export const useAuth=()=>({user:null});
export const useServerFn=()=>async()=>{throw new Error('Offline review has no server submission');};
export const submitQuizAttempt=()=>{throw new Error('Offline review has no server submission');};
export const logLearnerEvent=()=>Promise.resolve();
