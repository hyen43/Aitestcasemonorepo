figma.showUI(__html__, { themeColors: true, width: 300, height: 300 });

figma.ui.onmessage = (msg) => {
  if (msg.type === "get-description") {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.ui.postMessage({
        type: "description",
        error: "description용 텍스트 박스를 클릭하세요.",
      });
    }

    const node = selection[0];

    if ("desciprtion" in node) {
      const description = node.desciprtion || "";
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

  // figma.closePlugin();
};
