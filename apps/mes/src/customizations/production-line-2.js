async function fetchTagValues(tagIds) {
  const res = await fetch("http://localhost:3001/api/tags/values", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tagIds })
  });
  if (!res.ok) return [];
  return res.json();
}
const actions = {
  myCustomClickAction: (widget) => {
    console.log("\uC0DD\uC0B0 \uB77C\uC778 2: \uC704\uC82F \uD074\uB9AD\uB428", widget);
    alert("\uC0DD\uC0B0 \uB77C\uC778 2 \uC804\uC6A9 \uC561\uC158 \uC2E4\uD589");
  }
};
const styles = {
  theme: "dark"
};
export {
  actions,
  fetchTagValues,
  styles
};
