document.addEventListener('DOMContentLoaded', function() {
    async function updateVersionOptions() {
        const serverType = document.getElementById('serverType').value;
        const versionSelect = document.getElementById('version');
        let versions = [];

        switch (serverType) {
            case 'paper':
                versions = await fetchVersions('https://papermc.io/api/v2/projects/paper');
                break;
            case 'bucket':
                versions = await fetchVersions('https://api.example.com/bukkit'); // Replace with actual Bukkit API URL
                break;
            case 'vanilla':
                versions = await fetchVanillaVersions();
                break;
            case 'fabric':
                versions = await fetchFabricVersions();
                break;
        }

        versionSelect.innerHTML = '<option value="" disabled selected>Select Server Version</option>';
        versions.forEach(version => {
            const option = document.createElement('option');
            option.value = version;
            option.textContent = version;
            versionSelect.appendChild(option);
        });
    }

    async function fetchVersions(url) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data.versions || [];
        } catch (error) {
            console.error('Error fetching versions:', error);
            return [];
        }
    }

    async function fetchVanillaVersions() {
        try {
            const response = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json');
            const data = await response.json();
            return data.versions.map(v => v.id);
        } catch (error) {
            console.error('Error fetching Vanilla versions:', error);
            return [];
        }
    }

    async function fetchFabricVersions() {
        try {
            const response = await fetch('https://meta.fabricmc.net/v2/versions/game');
            const data = await response.json();
            return data.map(v => v.version);
        } catch (error) {
            console.error('Error fetching Fabric versions:', error);
            return [];
        }
    }

    async function downloadConfig() {
        const serverType = document.getElementById('serverType').value;
        const version = document.getElementById('version').value;
        const installLocation = document.getElementById('installLocation').value;
        const allocatedRam = document.getElementById('allocatedRam').value;
        const numPlayers = document.getElementById('numPlayers').value;
        const port = document.getElementById('port').value;
        const eula = document.getElementById('eula').checked;

        let downloadLink = '';

        switch (serverType) {
            case 'paper':
                downloadLink = await fetchDownloadLink(`https://papermc.io/api/v2/projects/paper/versions/${version}`);
                break;
            case 'bucket':
                downloadLink = await fetchDownloadLink(`https://api.example.com/bukkit/versions/${version}`); // Replace with actual Bukkit download URL
                break;
            case 'vanilla':
                downloadLink = await fetchVanillaDownloadLink(version);
                break;
            case 'fabric':
                downloadLink = await fetchDownloadLink(`https://meta.fabricmc.net/v2/versions/loader/${version}`); // Fabric loader download URL may vary
                break;
        }

        const zip = new JSZip();
        const serverFolder = zip.folder("server");

        // Download the server jar
        const response = await fetch(downloadLink);
        const blob = await response.blob();
        serverFolder.file("server.jar", blob);

        // Create server.properties file
        const serverProperties = `
server-port=${port}
max-players=${numPlayers}
allow-flight=true
difficulty=normal
spawn-protection=0
enable-command-block=true
`;
        serverFolder.file("server.properties", serverProperties);

        // Create EULA.txt file
        const eulaText = `
#By changing the setting below to TRUE you are indicating your agreement to our EULA (https://account.mojang.com/documents/minecraft_eula).
#  ${new Date().toISOString().split('T')[0]}
eula=${eula}
`;
        serverFolder.file("eula.txt", eulaText);

        // Generate the zip file and trigger download
        zip.generateAsync({ type: "blob" }).then(content => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(content);
            a.download = 'server.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    async function fetchDownloadLink(url) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            const build = data.builds[data.builds.length - 1];
            return `https://papermc.io/api/v2/projects/paper/versions/${data.version}/builds/${build}/downloads/paper-${data.version}-${build}.jar`; // Adjust according to actual API structure
        } catch (error) {
            console.error('Error fetching download link:', error);
            return '';
        }
    }

    async function fetchVanillaDownloadLink(version) {
        try {
            const response = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json');
            const data = await response.json();
            const versionData = data.versions.find(v => v.id === version);
            if (versionData) {
                const versionDetailsResponse = await fetch(versionData.url);
                const versionDetails = await versionDetailsResponse.json();
                return versionDetails.downloads.server.url;
            }
        } catch (error) {
            console.error('Error fetching Vanilla download link:', error);
        }
        return '';
    }

    // Expose functions to the global scope
    window.updateVersionOptions = updateVersionOptions;
    window.downloadConfig = downloadConfig;
});
