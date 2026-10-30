#!/bin/sh
# Railway start command for the DAM worker. The shell outlives node, so the exit status (and the
# signal, when one killed it: 137 = SIGKILL/OOM, 139 = SIGSEGV) always reaches the deploy logs.
set -u
# libvips (sharp) also starts one worker thread per host CPU per pipeline; keep it small (see probe.mjs).
export VIPS_CONCURRENCY="${VIPS_CONCURRENCY:-2}"
echo "[dam start] node $(node --version) pid $$ concurrency ${DAM_CONCURRENCY:-2} workdir ${DAM_WORK_DIR:-.content-engine/dam} vips ${VIPS_CONCURRENCY} ffmpeg-threads ${DAM_FFMPEG_THREADS:-2} cpus $(nproc)"
node --unhandled-rejections=warn engine/cli.mjs dam watch
status=$?
if [ "$status" -gt 128 ]; then echo "[dam start] node killed by signal $((status - 128)) (exit $status)"; else echo "[dam start] node exited with status $status"; fi
exit "$status"
