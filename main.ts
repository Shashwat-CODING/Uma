import { readFileSync, writeFileSync } from 'node:fs';


const musicStream = 'k2Fjn90aB0M';
const nonMusicStream = 'MvsAesQ-4zA';
const data = readFileSync('unified_instances.txt', 'utf8').split('\n\n');
const newData: { [index: string]: number } = {};

setImmediate(async () => {
  for await (const v of data) {
    const [name, _, piped, invidious] = v.split(', ');
    const score = await fetchAudioUrl(name, piped, invidious);
    newData[v] = score;
  }
  const sortedList = Object.entries(newData).sort((a, b) => b[1] - a[1]).map(v => v[0])

  writeFileSync('unified_instances.txt', sortedList.join('\n\n'));

});


async function fetchAudioUrl(name: string, piped: string, invidious: string) {

  const pipedInstance = `https://${piped}.${name}`;
  const invidiousInstance = `https://${invidious}.${name}`;
  let score = 0;

  await fetch(`${pipedInstance}/streams/${musicStream}`)
    .then(res => res.json())
    .then(data => {
      if ('audioStreams' in data) {
        score++;
        const audioUrl = data.audioStreams[0].url;
        const proxiedUrl = audioUrl.replace(new URL(audioUrl).origin, invidiousInstance);
        const t = performance.now();

        fetch(proxiedUrl)
          .then(data => data.blob())
          .then(() => {
            if (blob.type.startsWith('audio')) {
              console.log('\n✅ loaded music stream on ' + name);
              const timeTaken = performance.now() - t;
              score += (1/timeTaken);
            }
            else throw new Error();
          })
          .catch(() => {
            console.log('\n❌ failed to load music stream on ' + name);
          });
      }
      else throw new Error();
    })
    .catch(() => {
      console.log(`\n❌ failed to fetch music stream data on ${name}`);
    });

  await fetch(`${pipedInstance}/streams/${nonMusicStream}`)
    .then(res => res.json())
    .then(data => {
      if ('audioStreams' in data) {
        score++;
        const audioUrl = data.audioStreams[0].url;
        const construct = new URL(audioUrl);
        const deproxiedUrl = audioUrl.replace(
          construct.host,
          construct.searchParams.get('host'));
        const t = performance.now();
        
        fetch(deproxiedUrl)
          .then(data => data.blob())
          .then(blob => {
            if (blob.type.startsWith('audio')) {
              console.log('\n✅ loaded deproxified non-music stream on ' + name);
              const timeTaken = performance.now() - t;
              score += (1/timeTaken);
            }
            else throw new Error();
          })
          .catch(() => {
            console.log('\n❌ failed to load deproxified non-music stream on ' + name);
          });
      }
      else
        throw new Error();

    })
    .catch(() => {
      console.log(`\n❌ failed to fetch non-music stream data on ${name}`);
    });

  return score;

}

