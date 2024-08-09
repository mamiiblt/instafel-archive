import path from 'path';
import { Octokit } from 'octokit';
import dotenv from 'dotenv';
import fs, { existsSync } from 'fs';
import { release } from 'os';
dotenv.config();

const octokit = new Octokit({ auth: process.env.GITHUB_KEY });
async function run() {

    const releasesRequest = await octokit.request('GET /repos/{owner}/{repo}/releases', {
        owner: 'mamiiblt',
        page: 1, // burdan hangi sayfadaki içerikleri indireceğini ayarlıyon
        repo: 'instafel_release_arm64-v8a',
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
    })

    releasesRequest.data.forEach(async release => {
        var verChangelogStr = release.body.split("(")[0].split(" ");
        var ig_version = null;
        verChangelogStr.forEach(line => {
            if (line.startsWith("v")) {
                ig_version = line;
            }
        });

        if (ig_version != null) {
            console.log("> Downloading " + release.tag_name + "(" + ig_version + ")")
            const folderFormat = ig_version;
            if (!fs.existsSync(folderFormat)) {
                fs.mkdirSync(folderFormat)
                fs.mkdirSync(folderFormat + "/arm64")
                fs.mkdirSync(folderFormat + "/arm32")
            }

            var asset_info = {
                "manifest_version": 1,
                "assets": [

                ]
            }

            for (let i = 0; i < release.assets.length; i++) {
                let asset = release.assets[i];

                console.log("Downloading asset " + asset.name)

                const response = await octokit.request('GET /repos/{owner}/{repo}/releases/assets/{asset_id}', {
                    owner: 'mamiiblt',
                    repo: 'instafel_release_arm64-v8a',
                    asset_id: asset.id,
                    headers: {
                      'X-GitHub-Api-Version': '2022-11-28',
                      'Accept': 'application/octet-stream'
                    }
                })

                asset_info.assets.push({
                    name: asset.name,
                    content_type: asset.content_type,
                    id: asset.id,
                    size: asset.size,
                    created_at: asset.created_at
                })

                fs.writeFileSync(folderFormat + "/arm64/" + asset.name, Buffer.from(response.data), (err) => {
                    if (err) {
                        console.error(`Error while downloading ${asset.name} file.`, err);
                        return;
                    }
                })

                if (i + 1 == release.assets.length) {
                    fs.writeFileSync(folderFormat + "/arm64/asset_info.json", JSON.stringify(asset_info), { encoding: 'utf-8'})
                }
            }
        } else {
            console.log("IG Version cannot be initialized")
        }
        // console.log()
        // var version_name = 
    });
}

run();