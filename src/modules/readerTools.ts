import { config } from "../../package.json";
import {
  Relations,
  createTopDiv,
  getItem,
  openAnnotation,
} from "../utils/zzlb";
function register() {
  Zotero.Reader.registerEventListener(
    "renderToolbar",
    readerToolbarCallback,
    config.addonID,
  );
  Zotero.Reader.registerEventListener(
    "renderSidebarAnnotationHeader",
    renderSidebarAnnotationHeaderCallback,
    config.addonID,
  );
}
function unregister() {
  Zotero.Reader.unregisterEventListener("renderToolbar", readerToolbarCallback);
  Zotero.Reader.unregisterEventListener(
    "renderSidebarAnnotationHeader",
    renderSidebarAnnotationHeaderCallback,
  );
}
export default { register, unregister };

function readerToolbarCallback(
  event: Parameters<_ZoteroTypes.Reader.EventHandler<"renderToolbar">>[0],
) {
  const { append, doc, reader, params } = event;
  copyFunc(doc, "readerToolbarCallback");
}
function renderSidebarAnnotationHeaderCallback(
  event: Parameters<
    _ZoteroTypes.Reader.EventHandler<"renderSidebarAnnotationHeader">
  >[0],
): void | Promise<void> {
  const { append, doc, reader, params } = event;
  copyFunc(doc, "renderSidebarAnnotationHeaderCallback");
  ztoolkit.log(event, params.annotation.id);
  const relations = new Relations(params.annotation.id);
  // relations.getLinkRelations()
  // const relatedAnnotations= getRelatedAnnotations(ann);
  const linkAnnotations = relations.getLinkRelations();
  ztoolkit.log("readerToolbarCallback111", params, linkAnnotations);
  const userActions: HTMLElement[] = [];
  const add = ztoolkit.UI.createElement(doc, "span", {
    id: `renderSidebarAnnotationHeader-add-${params.annotation.id}`,
    properties: { textContent: "🧷" },
    listeners: [
      {
        type: "click",
        listener: (e) => {
          const r = new Relations(params.annotation.id);
          const man = Relations.allOpenPdf(addon.data.copy);
          r.setRelations(man.map((a) => a.openPdf));
        },
      },
      {
        type: "mouseover",
        listener: (e) => {
          (e.target as HTMLElement).style.backgroundColor = "#F0F0F0";
        },
      },
      {
        type: "mouseout",
        listener: (e) => {
          (e.target as HTMLElement).style.removeProperty("background-color");
        },
      },
    ],
    enableElementRecord: false,
    ignoreIfExists: true,
  });
  userActions.push(add);
  ztoolkit.log("userActions1", userActions);
  if (linkAnnotations && linkAnnotations.length > 0) {
    const u = ztoolkit.UI.createElement(doc, "span", {
      id: `renderSidebarAnnotationHeader-link-${params.annotation.id}`,
      properties: { textContent: "🍡" },
      listeners: [
        {
          type: "click",
          listener: (e) => {
            // const r0 = relatedAnnotations[0];
            // openAnnotation(r0.parentItem!,r0.annotationPageLabel,r0.key)
            const div = createTopDiv(doc, config.addonRef + `-TopDiv`, [
              "action",
              "status",
              "query",
              "content",
            ])!;
            const m = Relations.mapOpenPdf(linkAnnotations);
            for (const m0 of m) {
              const an = getItem(m0.annotationKey);
              const content = `${an.parentItem?.getDisplayTitle()}   ${an.annotationType} ${an.annotationText || ""} ${an.annotationComment || ""} `;
              ztoolkit.UI.appendElement(
                {
                  tag: "div",
                  styles: {
                    padding: "2px",
                    background: an.annotationColor + "80",
                    marginRight: "20px",
                  },
                  properties: { textContent: content },
                  listeners: [
                    {
                      type: "click",
                      listener: () => {
                        openAnnotation(m0.pdfKey, m0.page, m0.annotationKey);
                      },
                    },
                  ],
                },
                div.querySelector(".content")!,
              );
            }
            ztoolkit.log(m);
            // const m0 = m[0];
            // openAnnotation(m0.pdfKey, m0.page, m0.annotationKey);
            // const m=linkAnnotations[0].match(new RegExp("zotero://open-pdf/library/items/(.*?)[?]page=(.*?)&annotation=(.*)"))
            // if(m)
            // openAnnotation(Zotero.Items.get(m[1]),m[2],m[3]);
            e.preventDefault();
          },
        },
        {
          type: "mouseover",
          listener: (e) => {
            (e.target as HTMLElement).style.backgroundColor = "#F0F0F0";
          },
        },
        {
          type: "mouseout",
          listener: (e) => {
            (e.target as HTMLElement).style.removeProperty("background-color");
          },
        },
      ],
      enableElementRecord: false,
      ignoreIfExists: true,
    });
    userActions.push(u);
  }
  ztoolkit.log("userActions2", userActions);
  if (userActions.length > 0) append(...userActions);
}

function getRelatedAnnotations(ann: Zotero.Item) {
  if (ann.relatedItems && ann.relatedItems.length > 0) {
    const relatedItemsA = Zotero.Items.get(ann.relatedItems);
    ztoolkit.log("getRelatedAnnotations", relatedItemsA);
    return relatedItemsA.filter((f) => f.isAnnotation());
  }
  return [];
}

function copyFunc(doc: Document, copyFrom: string = "") {
  if ((doc as any)._copyFrom) return;
  (doc as any)._copyFrom = copyFrom;
  doc.addEventListener("copy", function (e) {
    // clipboardData 对象是为通过编辑菜单、快捷菜单和快捷键执行的编辑操作所保留的，也就是你复制或者剪切内容
    //@ts-ignore window.clipboardData
    const clipboardData = e.clipboardData || window.clipboardData;
    // 如果 未复制或者未剪切，直接 return
    if (!clipboardData) return;
    // Selection 对象 表示用户选择的文本范围或光标的当前位置。
    // 声明一个变量接收 -- 用户输入的剪切或者复制的文本转化为字符串
    const text = clipboardData.getData("text") as string;
    // ztoolkit.log("123 copy", doc, clipboardData, clipboardData.getData("text"));
    if (!text) return;
    // const man = text2Ma(text);
    const man = Relations.allOpenPdf(text);
    ztoolkit.log(man);
    doc.querySelector(`#${config.addonRef}-copy-annotations`)?.remove();
    if (man.length == 0) return;
    addon.data.copy = text;
    ztoolkit.log("复制内容 有效", addon.data.copy, man);
    const z = ztoolkit.UI.appendElement(
      {
        id: `${config.addonRef}-copy-annotations`,
        tag: "div",
        properties: { textContent: "已复制：" },
        styles: {
          position: "fixed",
          left: "10px",
          top: "45px",
          zIndex: "9999",
          boxShadow: "#999999 0px 0px 4px 3px",
          padding: "5px",
          background: "#ffffff",
        },
        children: man.map((m, i) => {
          const an = getItem(m.annotationKey);
          const content =
            (an.annotationComment || "") + (an.annotationText || "") + m.text;
          return {
            tag: "span",
            properties: { textContent: i + 1 + ":" + content.substring(0, 7) },
            styles: {
              background: an.annotationColor + "80",
              margin: "3px",
              border: "1px solid #000000",
            },
          };
        }),
        listeners: [
          {
            type: "click",
            listener: (e) => {
              z.remove();
            },
          },
        ],
      },
      doc.body,
    );
    setTimeout(() => {
      z.remove();
    }, 10000);
  });
}
export function text2Ma(text: string) {
  //    text = `“H2a：企业占据的结构洞数正向调节知识关键性 与网络权力的关系。 H2b：企业占据的结构洞数正向调节知识不可替 代性与网络权力的关系。 H2c：企业占据的结构洞数正向调节知识中心性 与网络权力的关系。” ([⁨刘立⁩和⁨党兴华⁩, 2014, p. 3](zotero://select/library/items/MBYKPZRC)) ([pdf](zotero://open-pdf/library/items/ALUKNMR8?page=3&annotation=UJ8F3GL4))

  // [image] ([pdf](zotero://open-pdf/library/items/ALUKNMR8?page=3&annotation=CCYZI87Y))
  // ([⁨刘立⁩和⁨党兴华⁩, 2014, p. 3](zotero://select/library/items/MBYKPZRC))

  // “知识价值性” ([⁨刘立⁩和⁨党兴华⁩, 2014, p. 5](zotero://select/library/items/MBYKPZRC)) ([pdf](zotero://open-pdf/library/items/ALUKNMR8?page=5&annotation=IL3PXPUF))`

  const reStr =
    ".*[[]pdf][(](zotero://open-pdf/library/items/(.*?)[?]page=(.*?)&annotation=(.*?))[)][)]";
  const reG = new RegExp(reStr, "g");
  const reN = new RegExp(reStr, "");
  // const reG = /.*[[]pdf][(](zotero:\/\/open-pdf\/library\/items\/(.*?)[?]page=(.*?)&annotation=(.*?))[)][)].*/g;
  // const reN = /^.*[[]pdf][(](zotero:\/\/open-pdf\/library\/items\/(.*?)[?]page=(.*?)&annotation=(.*?))[)][)].*$/;
  const mag = text.match(reG) || [];
  const man = mag
    .map((m) => m.match(reN) || [])
    .map((a) => ({
      text: a[0],
      openPdf: a[1],
      pdfKey: a[2],
      page: a[3],
      annotationKey: a[4],
    }));
  man;
  return man;
}