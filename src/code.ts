figma.showUI(__html__, { themeColors: true, width: 500, height: 500 });

figma.ui.onmessage = async (msg) => {
  console.log("msg", msg);
  // figma localstorage에서 자동 로그인을 위한 라이센스 값 확인 코드
  // 라이센스 키 저장
  if (msg.type === "save-license") {
    await figma.clientStorage.setAsync("licenseKey", msg.licenseKey);
  }
  // 라이센스 키가 없을 때, 최초 라이센스 키 get
  if (msg.type === "load-license") {
    const key = await figma.clientStorage.getAsync("licenseKey");
    figma.ui.postMessage({
      type: "license-loaded",
      licenseKey: key,
    });
  }
  // 라이센스 키 clear
  if (msg.type === "clear-licnese") {
    await figma.clientStorage.setAsync("licenseKey", null);
  }

  // 선택한 node 속에 description 추출하는 코드
  if (msg.type === "get-description") {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.ui.postMessage({
        type: "description",
        error: "description용 텍스트 박스를 클릭하세요.",
      });
    }

    const node = selection[0];

    if ("characters" in node) {
      const description = node.characters || "";
      figma.ui.postMessage({
        type: "description",
        data: description,
      });
    } else {
      figma.ui.postMessage({
        type: "description",
        error: "선택한 영역에 description이 없습니다.",
      });
    }
  }
};
