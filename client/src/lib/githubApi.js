export async function pushToGitHub({ token, repo, branch = 'main', message, files }) {
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
    };
    
    const baseUrl = `https://api.github.com/repos/${repo}`;

    const apiCall = async (endpoint, options = {}) => {
        const res = await fetch(`${baseUrl}${endpoint}`, { ...options, headers });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(`GitHub API Error: ${res.statusText} - ${errorData.message || ''}`);
        }
        return res.json();
    };

    // 1. Get current reference for branch
    let refData;
    try {
        refData = await apiCall(`/git/ref/heads/${branch}`);
    } catch (err) {
        if (branch === 'main') {
            console.log("Branch 'main' not found, falling back to 'master'");
            branch = 'master';
            refData = await apiCall(`/git/ref/heads/${branch}`);
        } else {
            throw err;
        }
    }
    const latestCommitSha = refData.object.sha;

    // 2. Get base tree
    const commitData = await apiCall(`/git/commits/${latestCommitSha}`);
    const baseTreeSha = commitData.tree.sha;

    // 3. Create Blob objects for all files
    const newTreeModes = [];
    for (const file of files) {
        const blobData = await apiCall('/git/blobs', {
            method: 'POST',
            body: JSON.stringify({
                content: file.content,
                encoding: 'utf-8'
            })
        });
        
        newTreeModes.push({
            path: file.path,
            mode: '100644',
            type: 'blob',
            sha: blobData.sha
        });
    }

    // 4. Create a new Tree object containing the new blobs
    const treeData = await apiCall('/git/trees', {
        method: 'POST',
        body: JSON.stringify({
            base_tree: baseTreeSha,
            tree: newTreeModes
        })
    });
    const newTreeSha = treeData.sha;

    // 5. Create a new Commit object
    const newCommitData = await apiCall('/git/commits', {
        method: 'POST',
        body: JSON.stringify({
            message: message,
            tree: newTreeSha,
            parents: [latestCommitSha]
        })
    });
    const newCommitSha = newCommitData.sha;

    // 6. Fast-forward the reference to the new commit
    const updatedRefData = await apiCall(`/git/refs/heads/${branch}`, {
        method: 'PATCH',
        body: JSON.stringify({
            sha: newCommitSha,
            force: false
        })
    });

    return updatedRefData;
}
