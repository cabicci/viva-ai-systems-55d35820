# Exact media-tool bootstrap proposal

Observed cause: S05 Arabic master job 121520109950 (run 40307493253) spent almost its entire 20-minute allowance installing Ubuntu FFmpeg dependencies: apt resolution 10:27:19, final package setup 10:46:35, cancellation 10:47:13 UTC. The upload reported no output files. Cleanup identified Python and FFprobe processes. This proves provisioning consumed the time budget; it does not prove a Remotion or audio defect.

Successful S03 Arabic scene recovery in run 40308939812 rendered 1362 frames in about 133 seconds, then completed mux, decode and checkpoints. S02 English03 and S04 English04 were still running when inspected; their failure location remains pending actual terminal logs. Do not blame the Audio component without that evidence. The current renderer already passes muted:true; exact pinned source confirms that disables audio output. Removing the redundant Audio component can be a separate simplification, not a demonstrated repair for provisioning delay.

The official @remotion/compositor-linux-x64-gnu@4.0.466 npm archive was downloaded for read-only inspection and verified against the SHA512 integrity already pinned by the project's existing lock. It contains FFmpeg, FFprobe, the Remotion compositor and seven adjacent shared libraries. No package script or Linux binary was executed locally. verified-package.en.json records the actual archive identity and every contained file's SHA256/size. Keep the archive on drive as inspection evidence; only package.json, package-lock.json, bootstrap.cjs and verified-package.en.json need staging.

bootstrap.cjs runs only on Linux x64 Actions. It finds the exact installed companion through the declared dependency root, verifies all fifteen file hashes, preserves the shared libraries in their installed directory, creates a unique job-owned bin directory and symlinks both commands into it. Ten-second version checks exercise the linked executables before PATH exposure; all bootstrap subprocesses have explicit timeouts. GITHUB_PATH exposes this directory only to subsequent job steps. No global tool installation, apt, sudo, fallback download or credential is used by bootstrap.

Scene jobs can reuse their existing pinned npm ci. Master jobs use the supplied tiny lock containing just this exact companion, with npm ci --ignore-scripts --no-audit --no-fund. The lock's resolved URL and SHA512 are fixed. Provisioning remains a separate finite step, followed by both-tool preflight and existing source/hash/PCM gates. workflow-replacements.en.yml gives the exact replacements. Root stages and dispatches only scoped future jobs or confirmed provisioning failures. No successful media is rerendered solely for this change.

Primary evidence:
- https://raw.githubusercontent.com/remotion-dev/remotion/v4.0.466/packages/renderer/src/compositor/get-executable-path.ts — exact version resolves FFmpeg/FFprobe from companion directory.
- https://raw.githubusercontent.com/remotion-dev/remotion/v4.0.466/packages/compositor-linux-x64-gnu/index.js — exports the package directory.
- https://raw.githubusercontent.com/remotion-dev/remotion/v4.0.466/packages/compositor-linux-x64-gnu/package.json — exact version/platform declaration.
- https://www.remotion.dev/docs/renderer/ensure-ffmpeg — explicitly removed in v4; not the proposed API.
- https://raw.githubusercontent.com/remotion-dev/remotion/v4.0.466/packages/renderer/src/render-media.ts — muted disables audio; timeoutInMilliseconds is not an overall process watchdog.

Limits: archive/SRI inspection and source/API verification are complete; Linux execution, codecs, FFprobe output and actual media assembly must still be verified on Actions. No source speech, image, timing, accepted PCM or course content changed here.
