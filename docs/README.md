# 文档索引

根目录 README 只保留项目介绍、快速开始和文档入口。玩法细节、工程结构和维护流程集中放在本目录，减少重复内容，也方便按用途查找。

## 第一次了解项目

建议按以下顺序阅读：

1. [`gameplay.md`](gameplay.md)：了解游戏怎么玩、当前有哪些功能，以及尚未接入的能力。
2. [`ux.md`](ux.md)：了解单视口操作、回看、自动保存和观点交锋的界面规则。
3. [`architecture.md`](architecture.md)：了解 React、PixiJS、剧情运行时、结算引擎和数据文件之间的关系。
4. [`maintenance.md`](maintenance.md)：了解本地环境、测试命令、数据维护和发布流程。

## 按需求查找

| 需求 | 文档 |
|---|---|
| 了解玩法、年份线、角色路线和当前限制 | [`gameplay.md`](gameplay.md) |
| 了解一屏操作、剧情回看、自动保存和档案抽屉 | [`ux.md`](ux.md) |
| 查找模块边界、状态流转、数据关系和常见修改位置 | [`architecture.md`](architecture.md) |
| 安装依赖、运行测试、更新数据、构建和发布 | [`maintenance.md`](maintenance.md) |
| 编写角色对白和维护人物设定 | [`characters.md`](characters.md) |
| 了解自动化助手和维护者的操作约定 | [`../AGENTS.md`](../AGENTS.md) |

## 文档分工

- 根目录 `README.md` 面向第一次接触项目的玩家和开发者。
- `gameplay.md` 记录当前可以看到和操作的功能。
- `ux.md` 记录主界面的操作规则和呈现约束。
- `architecture.md` 记录代码结构和技术边界。
- `maintenance.md` 记录具体命令和维护流程。
- `characters.md` 记录角色语言和剧情写作规范。
- `AGENTS.md` 记录修改项目时需要长期遵守的约定。

文档只描述当前实现。历史调整过程留在提交记录和拉取请求中，避免把维护说明写成项目考古报告。
