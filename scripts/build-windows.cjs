'use strict';
const path = require('node:path');
const { build, Platform, Arch } = require('electron-builder');

// electron-builder 26.15.3 already ships a native NSIS uninstaller reader for
// hosts that cannot execute Wine. Use that exact reader for this one build
// step on Linux, too. All other executable invocations retain normal behavior.
if (process.platform === 'linux') {
  const { WineVmManager } = require('app-builder-lib/out/vm/WineVm');
  const { UninstallerReader } = require('app-builder-lib/out/targets/nsis/nsisUtil');
  const original = WineVmManager.prototype.exec;
  WineVmManager.prototype.exec = function (file, args, options, ...rest) {
    if (options?.env?.__COMPAT_LAYER === 'RunAsInvoker' && args?.length === 0 && /^Tangerine-[\d.]+-Setup-x64\.exe$/.test(path.basename(file))) {
      const destination = path.join(path.dirname(file), path.basename(file, 'exe') + '__uninstaller.exe');
      console.log('  • extracting NSIS uninstaller with the bundled native reader');
      return UninstallerReader.exec(file, destination);
    }
    return original.call(this, file, args, options, ...rest);
  };
}
const prepackagedIndex = process.argv.indexOf('--prepackaged');
const prepackaged = prepackagedIndex >= 0 ? path.resolve(process.argv[prepackagedIndex + 1]) : undefined;
const targets = process.argv.includes('--no-zip') ? ['nsis', 'portable'] : ['nsis', 'portable', 'zip'];
build({ publish: 'never', targets: Platform.WINDOWS.createTarget(targets, Arch.x64), ...(prepackaged ? { prepackaged } : {}) })
  .catch(error => { console.error(error); process.exitCode = 1; });
