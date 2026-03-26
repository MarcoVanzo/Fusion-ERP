const mockContext = (() => {
  let t = [], a = [];
  let n = null;
  const Store = { get: async () => [1, 2] };
  const Router = { getCurrentRoute: () => "staff" };
  const renderDocumentsView = () => console.log("render doc");
  const r = () => { console.log("r called with t =", t, "a =", a); };

  async function init() {
    try {
      (([t, a] = await Promise.all([
        Store.get("list", "staff"),
        Store.get("teams", "athletes").catch(() => []),
      ])),
        (n = null),
        Router.getCurrentRoute() === "staff-documents"
          ? renderDocumentsView()
          : r());
    } catch (e) {
      console.error(e);
    }
  }

  return { init };
})();

mockContext.init().then(() => console.log("Done"));
