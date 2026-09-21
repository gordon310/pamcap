/// <reference types="vite/client" />

interface BuildInfo {
  sha: string;
  time: string;
}

declare const __BUILD_INFO__: BuildInfo;
