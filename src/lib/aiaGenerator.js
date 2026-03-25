import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateScm } from './scmGenerator';
import { generateBky } from './bkyGenerator';
import { parseLayout } from './layoutParser';

export async function generateAia(project) {
  const zip = new JSZip();
  const username = 'user';
  const packagePath = `appinventor/ai_${username}/${project.name}`;

  // project.properties
  const props = generateProjectProperties(project, packagePath);
  zip.file('youngandroidproject/project.properties', props);

  // assets folder (empty for now)
  zip.folder('assets');

  // Each screen
  for (const screen of project.screens) {
    // Check if the code has a screen{} layout block
    const layoutResult = parseLayout(screen.code || '');

    // If layout markup was found, use those components; otherwise use the designer components
    const effectiveScreen = { ...screen };
    if (layoutResult.components) {
      effectiveScreen.components = layoutResult.components;
      effectiveScreen.code = layoutResult.remainingCode;
    }

    const scm = generateScm(effectiveScreen, project.name);
    const bky = generateBky(effectiveScreen);
    zip.file(`src/${packagePath}/${screen.name}.scm`, scm);
    zip.file(`src/${packagePath}/${screen.name}.bky`, bky);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${project.name}.aia`);
}

function generateProjectProperties(project, packagePath) {
  const now = new Date();
  const dateStr = now.toString();
  const lines = [
    '#',
    `#${dateStr}`,
    `main=${packagePath.replace(/\//g, '.')}.Screen1`,
    `name=${project.name}`,
    'assets=../assets',
    'source=../src',
    'build=../build',
    'versioncode=1',
    'versionname=1.0',
    `aname=${project.name}`,
    'sizing=Responsive',
    'showlistsasjson=True',
    'actionbar=True',
    'theme=AppTheme.Light.DarkActionBar',
    'useslocation=False',
    'defaultfilescope=App',
  ];
  return lines.join('\n');
}

export default generateAia;
