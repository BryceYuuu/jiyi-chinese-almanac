const PALETTES = {
  sun: {
    background: "#E9DFC6",
    backgroundEnd: "#F4EEDF",
    surface: "#FFFCF5",
    panel: "#FBF8EF",
    ink: "#202825",
    muted: "#657069",
    subtle: "#929B94",
    accent: "#A06C27",
    accentSoft: "#F0E1BF",
    seal: "#C94732",
    secondary: "#B9873E",
    line: "#E3D1AA",
    border: "rgba(183, 139, 70, 0.46)"
  },
  mountain: {
    background: "#D7E4DE",
    backgroundEnd: "#E9EFEA",
    surface: "#FCFDF8",
    panel: "#F6F9F4",
    ink: "#1F2925",
    muted: "#637168",
    subtle: "#8F9A92",
    accent: "#35695E",
    accentSoft: "#D5E4DC",
    seal: "#C94732",
    secondary: "#A77B3D",
    line: "#C9DCD3",
    border: "rgba(78, 124, 108, 0.42)"
  },
  paper: {
    background: "#EAE2DA",
    backgroundEnd: "#F1ECE5",
    surface: "#FFFBF5",
    panel: "#FBF5ED",
    ink: "#29231F",
    muted: "#766D65",
    subtle: "#9B9188",
    accent: "#765A4D",
    accentSoft: "#E9DDD4",
    seal: "#C94732",
    secondary: "#A9783F",
    line: "#E1CFC2",
    border: "rgba(132, 96, 78, 0.38)"
  }
};

function roundRect(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
  ctx.arcTo(x, y + height, x, y, safeRadius);
  ctx.arcTo(x, y, x + width, y, safeRadius);
  ctx.closePath();
}

function getWrappedLines(ctx, text, maxWidth, maxLines) {
  const characters = `${text || ""}`.split("");
  const noLineStartPunctuation = "，。！？；：、）》」』】…";
  const lines = [];
  let line = "";
  characters.forEach((character) => {
    const nextLine = line + character;
    if (ctx.measureText(nextLine).width > maxWidth && line) {
      if (noLineStartPunctuation.includes(character)) {
        lines.push(nextLine);
        line = "";
      } else {
        lines.push(line);
        line = character;
      }
    } else {
      line = nextLine;
    }
  });
  if (line) lines.push(line);
  const visibleLines = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    visibleLines[maxLines - 1] = `${visibleLines[maxLines - 1].slice(0, -1)}…`;
  }
  return visibleLines;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const visibleLines = getWrappedLines(ctx, text, maxWidth, maxLines);
  visibleLines.forEach((item, index) => ctx.fillText(item, x, y + index * lineHeight));
  return y + Math.max(0, visibleLines.length - 1) * lineHeight;
}

function drawCenteredWrappedText(ctx, text, centerX, centerY, maxWidth, lineHeight, maxLines) {
  const visibleLines = getWrappedLines(ctx, text, maxWidth, maxLines);
  const firstLineY = centerY - ((visibleLines.length - 1) * lineHeight) / 2;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  visibleLines.forEach((item, index) => {
    ctx.fillText(item, centerX, firstLineY + index * lineHeight);
  });
  ctx.restore();
}

function drawVerticallyCenteredText(ctx, text, x, centerY, maxWidth, lineHeight, maxLines) {
  const visibleLines = getWrappedLines(ctx, text, maxWidth, maxLines);
  const firstLineY = centerY - ((visibleLines.length - 1) * lineHeight) / 2;
  ctx.save();
  ctx.textBaseline = "middle";
  visibleLines.forEach((item, index) => {
    ctx.fillText(item, x, firstLineY + index * lineHeight);
  });
  ctx.restore();
}

function drawSingleLine(ctx, text, x, y, maxWidth) {
  let value = `${text || ""}`;
  if (ctx.measureText(value).width <= maxWidth) {
    ctx.fillText(value, x, y);
    return;
  }
  while (value && ctx.measureText(`${value}…`).width > maxWidth) value = value.slice(0, -1);
  ctx.fillText(`${value}…`, x, y);
}

function drawImageCover(ctx, image, x, y, width, height) {
  if (!image || !image.width || !image.height) return;
  const sourceRatio = image.width / image.height;
  const targetRatio = width / height;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.width;
  let sourceHeight = image.height;
  if (sourceRatio > targetRatio) {
    sourceWidth = image.height * targetRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width / targetRatio;
    sourceY = (image.height - sourceHeight) / 2;
  }
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawCard(ctx, x, y, width, height, radius, fill, shadow) {
  ctx.save();
  if (shadow) {
    ctx.shadowColor = shadow.color;
    ctx.shadowBlur = shadow.blur;
    ctx.shadowOffsetX = shadow.offsetX || 0;
    ctx.shadowOffsetY = shadow.offsetY || 0;
  }
  roundRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

function drawDiamond(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = color;
  ctx.fillRect(-size / 2, -size / 2, size, size);
  ctx.restore();
}

function drawSealLogo(ctx, x, y, palette) {
  ctx.save();
  ctx.shadowColor = "rgba(106, 47, 32, 0.16)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 2;
  roundRect(ctx, x, y, 38, 46, 7);
  ctx.fillStyle = palette.seal;
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.96)";
  ctx.lineWidth = 1.4;
  roundRect(ctx, x + 3, y + 3, 32, 40, 5);
  ctx.stroke();
  ctx.strokeStyle = palette.seal;
  ctx.lineWidth = 0.8;
  roundRect(ctx, x - 1.5, y - 1.5, 41, 49, 8);
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "600 14px serif";
  ctx.textAlign = "center";
  ctx.fillText("吉", x + 19, y + 19);
  ctx.fillText("易", x + 19, y + 35);
  ctx.textAlign = "left";
}

function drawHeader(ctx, width, palette, content) {
  drawSealLogo(ctx, 28, 25, palette);
  ctx.strokeStyle = palette.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(28, 63);
  ctx.lineTo(92, 63);
  ctx.stroke();
  roundRect(ctx, 59, 55, 16, 7, 3.5);
  ctx.strokeStyle = palette.secondary;
  ctx.globalAlpha = 0.42;
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.fillStyle = palette.ink;
  ctx.font = "500 11px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(content.eyebrow || "今日吉易", width - 28, 41);
  ctx.strokeStyle = palette.secondary;
  ctx.beginPath();
  ctx.moveTo(width - 73, 51);
  ctx.lineTo(width - 28, 51);
  ctx.stroke();
  drawDiamond(ctx, width - 50, 51, 4, palette.secondary);
  ctx.textAlign = "left";
}

function drawFallbackLandscape(ctx, x, y, width, height, palette, variant) {
  ctx.save();
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = palette.accentSoft;
  ctx.beginPath();
  ctx.moveTo(x, y + height * 0.75);
  ctx.quadraticCurveTo(x + width * 0.2, y + height * (0.43 + variant * 0.03), x + width * 0.48, y + height * 0.72);
  ctx.quadraticCurveTo(x + width * 0.7, y + height * 0.9, x + width, y + height * 0.5);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.48;
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.moveTo(x, y + height * 0.86);
  ctx.quadraticCurveTo(x + width * 0.25, y + height * 0.68, x + width * 0.52, y + height * 0.88);
  ctx.quadraticCurveTo(x + width * 0.76, y + height, x + width, y + height * 0.72);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHero(ctx, width, palette, content, variant, visual) {
  const x = 27;
  const y = 75;
  const panelWidth = width - 54;
  const panelHeight = 194;
  ctx.save();
  roundRect(ctx, x, y, panelWidth, panelHeight, 18);
  ctx.fillStyle = "rgba(255, 252, 245, 0.30)";
  ctx.fill();
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = palette.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(144, 98);
  ctx.lineTo(144, 205);
  ctx.stroke();
  drawDiamond(ctx, 144, 153, 5, palette.secondary);

  ctx.fillStyle = palette.accent;
  ctx.font = "400 72px Georgia";
  ctx.fillText(`${content.day}`, 45, 155);
  ctx.fillStyle = palette.ink;
  ctx.font = "500 16px sans-serif";
  ctx.fillText(content.monthDay || content.date || "", 50, 190);
  ctx.fillStyle = palette.muted;
  ctx.font = "400 12px sans-serif";
  drawSingleLine(ctx, content.lunar || "", 50, 211, 82);

  ctx.fillStyle = palette.seal;
  ctx.font = "600 14px sans-serif";
  ctx.save();
  ctx.textAlign = "center";
  drawSingleLine(ctx, content.headline || "", 238, 117, 142);
  ctx.restore();

  const titleLength = Array.from(`${content.title || ""}`).length;
  const titleFontSize = titleLength <= 4 ? 34 : titleLength <= 7 ? 30 : 25;
  ctx.fillStyle = palette.ink;
  ctx.font = `600 ${titleFontSize}px "Songti SC", serif`;
  drawCenteredWrappedText(
    ctx,
    content.title || "",
    238,
    167,
    142,
    titleFontSize + 4,
    2
  );

  ctx.strokeStyle = "rgba(65, 109, 93, 0.18)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(45, 218);
  ctx.lineTo(width - 45, 218);
  ctx.stroke();
  ctx.fillStyle = palette.accent;
  ctx.globalAlpha = 0.26;
  ctx.font = "500 23px serif";
  ctx.fillText("“", 48, 249);
  ctx.globalAlpha = 1;
  ctx.fillStyle = palette.ink;
  ctx.font = "400 12.5px \"Songti SC\", serif";
  drawVerticallyCenteredText(ctx, content.primary || "", 63, 245, width - 108, 17.5, 2);
}

function cleanSecondary(text) {
  return `${text || ""}`.replace(/^今日适合\s*/, "").replace(/^推荐信息\s*/, "");
}

function drawLeafBadge(ctx, x, y, palette) {
  ctx.fillStyle = palette.accent;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.72;
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 4, y + 5);
  ctx.quadraticCurveTo(x + 2, y - 5, x + 6, y - 7);
  ctx.moveTo(x - 1, y + 1);
  ctx.quadraticCurveTo(x - 7, y - 2, x - 7, y - 7);
  ctx.moveTo(x + 2, y - 2);
  ctx.quadraticCurveTo(x + 7, y - 1, x + 8, y - 5);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawSuitable(ctx, width, palette, content) {
  drawCard(ctx, 28, 282, width - 56, 40, 18, "rgba(249, 250, 243, 0.62)");
  ctx.strokeStyle = "rgba(255, 255, 255, 0.56)";
  ctx.lineWidth = 0.8;
  roundRect(ctx, 28, 282, width - 56, 40, 18);
  ctx.stroke();
  drawLeafBadge(ctx, 47, 302, palette);
  ctx.fillStyle = palette.accent;
  ctx.font = "600 12px serif";
  ctx.fillText(content.kind === "daily" ? "今日适合" : "推荐信息", 67, 306);
  ctx.strokeStyle = palette.line;
  ctx.beginPath();
  ctx.moveTo(128, 293);
  ctx.lineTo(128, 311);
  ctx.stroke();
  ctx.fillStyle = palette.accent;
  ctx.font = "500 11.5px sans-serif";
  drawSingleLine(ctx, cleanSecondary(content.secondary), 141, 306, width - 174);
}

function drawReminder(ctx, width, palette, content) {
  ctx.strokeStyle = "rgba(65, 109, 93, 0.22)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(31, 338);
  ctx.lineTo(width - 31, 338);
  ctx.stroke();
  drawDiamond(ctx, 39, 356, 5, palette.secondary);
  ctx.fillStyle = palette.secondary;
  ctx.font = "600 12px serif";
  ctx.fillText(content.kind === "daily" ? "行事提醒" : "计划提醒", 51, 360);
  ctx.strokeStyle = palette.secondary;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(51, 368);
  ctx.lineTo(77, 368);
  ctx.stroke();

  ctx.fillStyle = palette.ink;
  ctx.font = "400 11.8px \"PingFang SC\", sans-serif";
  drawWrappedText(ctx, content.footer || "", 39, 387, width - 78, 18.5, 3);
}

function drawFooter(ctx, width, height, palette) {
  const baseline = height - 17;
  ctx.strokeStyle = palette.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(42, baseline - 3);
  ctx.lineTo(112, baseline - 3);
  ctx.moveTo(width - 112, baseline - 3);
  ctx.lineTo(width - 42, baseline - 3);
  ctx.stroke();
  drawDiamond(ctx, 121, baseline - 3, 4, palette.secondary);
  drawDiamond(ctx, width - 121, baseline - 3, 4, palette.secondary);
  ctx.fillStyle = palette.accent;
  ctx.font = "500 11.5px serif";
  ctx.textAlign = "center";
  ctx.fillText("吉易 · 每日生活参考", width / 2, baseline);
  ctx.textAlign = "left";
}

function drawBackground(ctx, width, height, palette, visual, variant) {
  if (ctx.createLinearGradient) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, palette.background);
    gradient.addColorStop(1, palette.backgroundEnd);
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = palette.background;
  }
  ctx.fillRect(0, 0, width, height);
  drawCard(ctx, 10, 8, width - 20, height - 16, 20, palette.surface, {
    color: "rgba(39, 53, 46, 0.16)", blur: 13, offsetY: 5
  });

  ctx.save();
  roundRect(ctx, 10, 8, width - 20, height - 16, 20);
  ctx.clip();
  if (visual && visual.backgroundImage) {
    drawImageCover(ctx, visual.backgroundImage, 10, 8, width - 20, height - 16);
  } else {
    drawFallbackLandscape(ctx, 10, 8, width - 20, height - 16, palette, variant);
  }
  ctx.globalAlpha = visual && typeof visual.overlayAlpha === "number"
    ? Math.max(0.46, visual.overlayAlpha + 0.34)
    : 0.54;
  ctx.fillStyle = palette.surface;
  ctx.fillRect(10, 8, width - 20, height - 16);
  ctx.globalAlpha = 1;
  if (ctx.createLinearGradient) {
    const readabilityMask = ctx.createLinearGradient(0, 250, 0, height);
    readabilityMask.addColorStop(0, "rgba(255, 252, 245, 0.02)");
    readabilityMask.addColorStop(1, "rgba(255, 252, 245, 0.24)");
    ctx.fillStyle = readabilityMask;
    ctx.fillRect(10, 250, width - 20, height - 258);
  }
  ctx.restore();

  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 1;
  roundRect(ctx, 11, 9, width - 22, height - 18, 19);
  ctx.stroke();
}

function drawEditorialPoster(ctx, width, height, palette, content, variant, visual) {
  drawBackground(ctx, width, height, palette, visual, variant);
  drawHeader(ctx, width, palette, content);
  drawHero(ctx, width, palette, content, variant, visual);
  drawSuitable(ctx, width, palette, content);
  drawReminder(ctx, width, palette, content);
  drawFooter(ctx, width, height, palette);
}

function drawPoster(ctx, width, height, style, content, variant, visual) {
  const palette = PALETTES[style] || PALETTES.sun;
  const scale = width / 358;
  const logicalHeight = height / scale;

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.scale(scale, scale);
  drawEditorialPoster(ctx, 358, logicalHeight, palette, content, variant, visual);
  ctx.restore();
}

module.exports = {
  drawPoster
};
