const f_id = Cookies.get('f_id')
if (!f_id) {
    document.querySelector("form").style.display = "none";
    document.querySelector("#auth").style.display = "block";
}

document.querySelector("#inp").addEventListener("submit", syncfile);

async function syncfile(e) {
    e.preventDefault();
    const name = document.querySelector("#filename").value;
    const code = document.querySelector("#code").value;
    const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, code })
    });
    console.log(await res.json());
}