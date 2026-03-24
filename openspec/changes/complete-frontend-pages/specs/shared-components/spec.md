## ADDED Requirements

### Requirement: Popup modal component
系统 SHALL 提供可复用的弹窗组件。

#### Scenario: Show popup
- **WHEN** 调用 showPopup 函数
- **THEN** 系统显示弹窗遮罩层

### Requirement: usePopup composable
系统 SHALL 提供弹窗状态管理函数。

#### Scenario: Control popup state
- **WHEN** 使用 usePopup 钩子
- **THEN** 系统返回 visible、showPopup、hidePopup 方法

### Requirement: useAuth hook
系统 SHALL 提供认证状态管理钩子。

#### Scenario: Check auth status
- **WHEN** 使用 useAuth 钩子
- **THEN** 系统返回 isAuthenticated、login、logout 方法
