# 3DGalaxy 全参数调参手册

所有可调参数均位于 `assets/js/3DGalaxy.js`，按功能分类。

---

## 一、星球

### 1.1 大小

| 参数 | 行号 | 代码 | 当前值 |
|------|------|------|--------|
| `planetRadius` | **L98** | `const planetRadius = 1.0` | `1.0` |

### 1.2 大陆轮廓

| 参数 | 行号 | 代码 | 效果 |
|------|------|------|------|
| 海岸线阈值 | **L113** | `const coastlineThreshold = 0.0` | 越大海越多 |
| 海岸线宽度 | **L114** | `const coastlineWidth = 0.18` | 越宽白线越粗 |

大陆噪声函数位于 **L104–111**，5 层正弦波叠加，可调每层的频率/相位/权重：

```js
function continentNoise(theta, phi) {
  return (
    Math.sin(theta * 1.5 + 0.3) * Math.cos(phi * 2.0 + 1.7) * 0.40 +  // 主大陆
    Math.sin(theta * 3.7 + 2.1) * Math.cos(phi * 2.3 + 4.2) * 0.25 +  // 次大陆
    Math.sin(theta * 7.2 + 5.3) * Math.sin(phi * 5.1 + 3.9) * 0.15 +  // 群岛
    Math.cos(theta * 11.0 - phi * 8.0 + 1.1) * 0.10 +                // 细节
    Math.sin((theta + phi) * 4.3 + 6.7) * 0.10                        // 扰动
  )
}
```

每个系数 `* 0.40` 越大该层影响越大，`* 1.5` 类频率越大碎块越多。

### 1.3 星球颜色

| 区域 | 行号 | 代码 | 当前颜色 |
|------|------|------|----------|
| 海岸线 | **L137–139** | `1.0, 1.0, 1.0` | 纯白 |
| 陆地 | **L142–144** | `0.04, 0.10, 0.06` | 暗蓝绿 |
| 海洋 | **L147–149** | `0.01, 0.01, 0.06` | 极暗蓝 |

### 1.4 星球粒子尺寸

**L273**（Galaxy vertex shader）：
```glsl
float planetPtSize = (10.0 * uSize) / -mvp.z;
```
改 `10.0`：越大点越大，星球越密集。

---

## 二、星环

| 参数 | 行号 | 代码 | 当前值 | 效果 |
|------|------|------|--------|------|
| 内半径 | **L360** | `const ringInner = 1.08` | `1.08` | 越接近 1.0 越贴星球 |
| 外半径 | **L361** | `const ringOuter = 1.35` | `1.35` | 环带宽度 = outer - inner |
| 倾斜角 | **L362** | `const ringTilt = 0.5` | `0.5` | 0=水平，越大越倾斜 |
| 厚度 | **L363** | `const ringThickness = 0.12` | `0.12` | 越大环越厚 |
| 粒子尺寸 | **L484** | `float ringPtSize = (8.0 * uSize) / -mvp.z` | `8.0` | 越大越亮 |

### 2.1 星环颜色

**L382–385**：
```js
const brightness = 0.4 + 0.6 * Math.max(...)  // 亮度渐变
universeTargetColor[i*3]   = 0.8 * brightness  // R
universeTargetColor[i*3+1] = 0.8 * brightness  // G
universeTargetColor[i*3+2] = 1.0 * brightness  // B（偏蓝白）
```
`RGB` 三个系数决定环的色调。

---

## 三、自转

| 参数 | 行号 | 代码 | 当前值 |
|------|------|------|--------|
| 自转速度 | **L569** | `planetRotUniform.value += t * 2` | `2` |

越大越快。`t = 0.001`（L564），所以每帧增加 `0.002` rad。

### 3.1 自转方向

**L254–255**（Galaxy shader）：
```glsl
float cpr = cos(-pr);  // 负号 = 逆时针
float spr = sin(-pr);
```
- 去掉 `-` → `cos(pr)`：顺时针
- 保留 `-` → `cos(-pr)`：逆时针

---

## 四、公转

### 4.1 公转速度

| 参数 | 行号 | 代码 | 当前值 |
|------|------|------|--------|
| 相位系数 | **L571** | `const phase = planetRotUniform.value * 0.8` | `0.8` |

越大公转越快。

### 4.2 公转半径

| 参数 | 行号 | 代码 | 当前值 |
|------|------|------|--------|
| `orbitR` | **L565** | `const orbitR = 1.8` | `1.8` |

0 = 不动，越大星球漂移范围越大。配合透视投影自动产生远近大小变化。

### 4.3 轨道面

**L572–575**：当前轨道在 XZ 平面（水平）：
```js
galaxy.position.x = Math.cos(phase) * orbit
galaxy.position.z = Math.sin(phase) * orbit
```
- 改 `galaxy.position.y` 可换到垂直面
- 同时改 `galaxy.position.x` / `galaxy.position.z` 可自定义轨道方向

---

## 五、星云（Galaxy + Universe 初始状态）

### 5.1 银河大小

| 参数 | 行号 | 代码 | 当前值 |
|------|------|------|--------|
| 展开半径 | **L542** | `radius: 1.618` | `1.618` |

### 5.2 银河旋臂

| 参数 | 行号 | 代码 | 当前值 |
|------|------|------|--------|
| 旋臂数 | **L176** | `uBranches: { value: 2 }` | `2` |
| 弯曲度 | **L543** | `spin: Math.PI * 2` | `Math.PI * 2` |
| 散开度 | **L544** | `randomness: 0.5` | `0.5` |

### 5.3 银河颜色

| 参数 | 行号 | 代码 | 当前值 |
|------|------|------|--------|
| 中心色 | **L165** | `new Color("#f40")` | 橙红 `#f40` |
| 外圈色 | **L166** | `new Color("#a7f")` | 紫 `#a7f` |

### 5.4 入场动画

| 参数 | 行号 | 代码 | 当前值 |
|------|------|------|--------|
| 时长 | **L547** | `.duration(3000)` | `3000ms` |
| 缓动 | **L548** | `.easing(TWEEN.Easing.Cubic.InOut)` | Cubic.InOut |
| 旋转圈数 | **L545** | `rotate: Math.PI * 4` | `Math.PI * 4`（2圈） |

### 5.5 持续旋转速度

| 参数 | 行号 | 代码 | 当前值 |
|------|------|------|--------|
| 基础步长 | **L564** | `const t = 0.001` | `0.001` |
| Galaxy 旋转 | **L567** | `uTime.value += t / 2` | `t / 2`（除数越小越快） |
| Universe 旋转 | **L568** | `uTime.value += t / 3` | `t / 3` |

---

## 六、Morph 过渡动画

| 参数 | 行号 | 代码 | 当前值 |
|------|------|------|--------|
| 过渡时长 | **L704** | `.to({ p: target }, 2200)` | `2200ms` |
| 缓动 | **L705** | `.easing(TWEEN.Easing.Cubic.InOut)` | Cubic.InOut |

---

## 七、导航箭头

### 7.1 按钮外观

| 参数 | 行号 | 代码 | 当前值 |
|------|------|------|--------|
| 尺寸 | **L653–654** | `width: 52px; height: 52px` | `52px` |
| 圆角 | **L655** | `border-radius: 10px` | `10px` |
| 字号 | **L658** | `font-size: 26px` | `26px` |
| 背景 | **L657** | `background: #000` | 黑底 |
| 箭头字符 | **L625/630** | `◂` / `▸` | Unicode 箭头 |

### 7.2 箭头位置

| 参数 | 行号 | 代码 | 效果 |
|------|------|------|------|
| 左右边距 | **L646** | `padding: 0 4vw` | `4vw` 越小越靠边 |

---

## 八、相机

| 参数 | 行号 | 代码 | 当前值 |
|------|------|------|--------|
| FOV（广角） | **L29** | `60` | `60` |
| 相机位置 | **L31** | `camera.position.set(0, 1.8, 3.1)` | `(x, y, z)` |

- `x`：左右偏移
- `y`：高度，越大越俯视
- `z`：距离，越大星球越小

---

## 九、粒子基础

| 参数 | 行号 | 代码 | 当前值 |
|------|------|------|--------|
| Galaxy 粒子数 | **L15** | `128 ** 2` | `16384` |
| Universe 粒子数 | **L357** | `count / 2` | `8192` |
| 星星基础大小 | **L175** | `uSize: { value: renderer.getPixelRatio() }` | 可乘系数 |

---

## 快速参考卡

```
星球大小       → L98   planetRadius
大陆形状       → L104  continentNoise()
海岸线粗细     → L114  coastlineWidth
星球颜色       → L135  三个 if 分支的 RGB
星环紧贴度     → L360  ringInner
星环宽度       → L361  ringOuter - ringInner
星环倾斜       → L362  ringTilt
自转速度       → L569  t * 系数
公转速度       → L571  * 系数
公转半径       → L565  orbitR
银河大小       → L542  radius:
银河颜色       → L165  innColor / outColor
粒子数         → L15   count
过渡动画速度   → L704  2200
箭头大小       → L653  width/height
箭头靠边       → L646  padding
```
