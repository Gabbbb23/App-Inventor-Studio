import { COMPONENTS } from '../lib/componentDefs';

export default function PhonePreview({ screen, selectedId, onSelect }) {
  // Separate visible and non-visible components
  const visibleComps = [];
  const nonVisibleComps = [];
  for (const comp of screen.components) {
    const def = COMPONENTS[comp.$Type];
    if (def && !def.isVisible) {
      nonVisibleComps.push(comp);
    } else {
      visibleComps.push(comp);
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* Phone frame */}
      <div className="relative">
        <div className="w-[360px] bg-[var(--color-phone-frame)] rounded-[40px] p-3 shadow-2xl">
          {/* Notch area */}
          <div className="bg-[var(--color-phone-frame)] rounded-t-[28px] flex justify-center py-2">
            <div className="w-20 h-5 bg-black rounded-full" />
          </div>

          {/* Screen area */}
          <div className="bg-[var(--color-phone-screen)] rounded-b-[28px] min-h-[580px] overflow-hidden flex flex-col">
            {/* Action bar */}
            <div className="bg-[#3F51B5] text-white px-4 py-3 text-sm font-medium shadow-md text-center">
              {screen.title || screen.name}
            </div>

            {/* Component area — acts as a vertical flex column like App Inventor's Screen */}
            <div className="flex-1 p-1 flex flex-col items-start">
              {visibleComps.length === 0 && nonVisibleComps.length === 0 ? (
                <div className="flex-1 w-full flex items-center justify-center text-gray-400 text-sm">
                  Add components from the palette
                </div>
              ) : visibleComps.length === 0 ? (
                <div className="flex-1 w-full flex items-center justify-center text-gray-300 text-xs">
                  Only non-visible components added
                </div>
              ) : (
                visibleComps.map(comp => (
                  <ComponentRenderer
                    key={comp.Uuid}
                    comp={comp}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    parentDir="column"
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Non-visible components tray (below phone, like App Inventor) */}
      {nonVisibleComps.length > 0 && (
        <div className="mt-3 w-[360px]">
          <div className="text-xs text-[var(--color-text-dim)] mb-1 px-1">Non-visible components</div>
          <div className="flex flex-wrap gap-2 p-2 bg-[var(--color-surface-light)] rounded-lg border border-[var(--color-border)]">
            {nonVisibleComps.map(comp => {
              const def = COMPONENTS[comp.$Type];
              const isSelected = comp.Uuid === selectedId;
              return (
                <button
                  key={comp.Uuid}
                  onClick={() => onSelect(comp.Uuid)}
                  className={`flex flex-col items-center gap-0.5 p-2 rounded transition-colors ${
                    isSelected
                      ? 'bg-[var(--color-primary)] bg-opacity-30 ring-1 ring-[var(--color-primary)]'
                      : 'hover:bg-[var(--color-surface-lighter)]'
                  }`}
                >
                  <span className="text-xl">{def?.icon || '📦'}</span>
                  <span className="text-[10px] text-[var(--color-text-dim)]">{comp.$Name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Parse color from App Inventor format (&HAARRGGBB) to CSS
function parseColor(colorStr) {
  if (!colorStr || !colorStr.startsWith('&H')) return null;
  const hex = colorStr.replace('&H', '');
  if (hex.length === 8) {
    const a = parseInt(hex.substring(0, 2), 16) / 255;
    const r = hex.substring(2, 4);
    const g = hex.substring(4, 6);
    const b = hex.substring(6, 8);
    return `rgba(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}, ${a})`;
  }
  return `#${hex}`;
}

// Parse dimension: -1 = auto (shrink to content), -2 = fill parent, positive = px
function parseDimension(val) {
  if (val === undefined || val === '' || val === '-1') return undefined; // auto / not set
  if (val === '-2') return '100%';
  const num = parseInt(val);
  if (!isNaN(num) && num > 0) return `${num}px`;
  return undefined;
}

function isFillWidth(props) {
  return props?.Width === '-2';
}

function isFillHeight(props) {
  return props?.Height === '-2';
}

// parentDir: 'column' | 'row' | null — tells child how to handle fill sizing in flex
function ComponentRenderer({ comp, selectedId, onSelect, parentDir }) {
  const isSelected = comp.Uuid === selectedId;
  const def = COMPONENTS[comp.$Type];

  const selectionStyle = isSelected
    ? 'ring-2 ring-[#4f46e5] ring-offset-1'
    : 'hover:ring-1 hover:ring-blue-300';

  const wrapperClick = (e) => {
    e.stopPropagation();
    onSelect(comp.Uuid);
  };

  const props = comp.properties || {};

  // Build style from explicit dimensions, flex-aware
  const getDimensionStyle = () => {
    const style = {};
    const w = parseDimension(props.Width);
    const h = parseDimension(props.Height);
    if (w) style.width = w;
    if (h) style.height = h;
    // In a flex column, Height:-2 needs flex:1 to fill remaining space
    if (parentDir === 'column' && isFillHeight(props)) {
      style.flex = '1 1 0';
      style.minHeight = '0';
    }
    // In a flex row, Width:-2 needs flex:1 to fill remaining space
    if (parentDir === 'row' && isFillWidth(props)) {
      style.flex = '1 1 0';
      style.minWidth = '0';
    }
    if (props.Visible === 'False') style.display = 'none';
    return style;
  };

  switch (comp.$Type) {
    case 'Button': {
      const bgColor = parseColor(props.BackgroundColor) || '#6188a0';
      const textColor = parseColor(props.TextColor) || '#000000';
      return (
        <div className={`m-0.5 cursor-pointer ${selectionStyle} rounded ${isFillWidth(props) ? 'w-full' : ''}`} onClick={wrapperClick}>
          <button
            className="rounded px-3 py-1.5 text-sm font-medium border border-gray-400/30"
            style={{
              backgroundColor: bgColor,
              color: textColor,
              fontSize: props.FontSize ? `${parseFloat(props.FontSize)}px` : '14px',
              fontWeight: props.FontBold === 'True' ? 'bold' : 'normal',
              ...getDimensionStyle(),
            }}
          >
            {props.Text || 'Text for Button1'}
          </button>
        </div>
      );
    }

    case 'Label': {
      const textColor = parseColor(props.TextColor) || '#000000';
      const bgColor = parseColor(props.BackgroundColor);
      const alignMap = { '0': 'left', '1': 'center', '2': 'right' };
      return (
        <div className={`m-0.5 cursor-pointer ${selectionStyle} rounded ${isFillWidth(props) ? 'w-full' : ''}`} onClick={wrapperClick}>
          <div
            className="px-1 py-0.5 text-sm"
            style={{
              color: textColor,
              backgroundColor: bgColor || 'transparent',
              fontSize: props.FontSize ? `${parseFloat(props.FontSize)}px` : '14.5px',
              fontWeight: props.FontBold === 'True' ? 'bold' : 'normal',
              fontStyle: props.FontItalic === 'True' ? 'italic' : 'normal',
              textAlign: alignMap[props.TextAlignment] || 'left',
              ...getDimensionStyle(),
            }}
          >
            {props.Text || 'Text for Label1'}
          </div>
        </div>
      );
    }

    case 'TextBox':
    case 'PasswordTextBox': {
      return (
        <div className={`m-0.5 cursor-pointer ${selectionStyle} rounded ${isFillWidth(props) ? 'w-full' : ''}`} onClick={wrapperClick}>
          <input
            type={comp.$Type === 'PasswordTextBox' ? 'password' : 'text'}
            placeholder={props.Hint || ''}
            defaultValue={props.Text || ''}
            readOnly
            className="border-b-2 border-gray-400 px-2 py-1.5 text-sm bg-transparent text-black outline-none"
            style={{
              fontSize: props.FontSize ? `${parseFloat(props.FontSize)}px` : '14px',
              width: parseDimension(props.Width) || '160px',
              ...getDimensionStyle(),
            }}
          />
        </div>
      );
    }

    case 'CheckBox': {
      return (
        <div className={`m-0.5 cursor-pointer ${selectionStyle} rounded flex items-center gap-1.5 px-1 py-0.5 ${isFillWidth(props) ? 'w-full' : ''}`} onClick={wrapperClick}>
          <input type="checkbox" defaultChecked={props.Checked === 'True'} readOnly className="w-4 h-4" />
          <span className="text-sm text-black" style={{ fontSize: props.FontSize ? `${parseFloat(props.FontSize)}px` : '14px' }}>
            {props.Text || 'CheckBox'}
          </span>
        </div>
      );
    }

    case 'Switch': {
      return (
        <div className={`m-0.5 cursor-pointer ${selectionStyle} rounded flex items-center gap-2 px-1 py-0.5 ${isFillWidth(props) ? 'w-full' : ''}`} onClick={wrapperClick}>
          <span className="text-sm text-black">{props.Text || 'Switch'}</span>
          <div className={`w-9 h-5 rounded-full relative ${props.On === 'True' ? 'bg-[#4caf50]' : 'bg-gray-400'}`}>
            <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 shadow transition-all ${props.On === 'True' ? 'left-[18px]' : 'left-0.5'}`} />
          </div>
        </div>
      );
    }

    case 'Image': {
      const w = parseDimension(props.Width) || '80px';
      const h = parseDimension(props.Height) || '80px';
      return (
        <div className={`m-0.5 cursor-pointer ${selectionStyle} rounded`} onClick={wrapperClick}>
          <div
            className="bg-gray-200 flex items-center justify-center text-gray-400 text-xs"
            style={{ width: w, height: h }}
          >
            Image
          </div>
        </div>
      );
    }

    case 'Slider': {
      const w = parseDimension(props.Width) || '150px';
      return (
        <div className={`m-0.5 cursor-pointer ${selectionStyle} rounded px-1 py-1 ${isFillWidth(props) ? 'w-full' : ''}`} onClick={wrapperClick}>
          <input
            type="range"
            min={props.MinValue || '10'}
            max={props.MaxValue || '50'}
            defaultValue={props.ThumbPosition || '30'}
            readOnly
            className="accent-[#ff9800]"
            style={{ width: isFillWidth(props) ? '100%' : w }}
          />
        </div>
      );
    }

    case 'ListView': {
      const elements = props.ElementsFromString
        ? props.ElementsFromString.split(',').slice(0, 4)
        : [];
      const w = parseDimension(props.Width) || '100%';
      const h = parseDimension(props.Height) || 'auto';
      return (
        <div
          className={`m-0.5 cursor-pointer ${selectionStyle} bg-black ${isFillWidth(props) || !props.Width || props.Width === '-1' ? 'w-full' : ''}`}
          onClick={wrapperClick}
          style={{ width: isFillWidth(props) ? '100%' : w, height: h, minHeight: '40px' }}
        >
          {elements.length > 0 ? (
            elements.map((item, i) => (
              <div key={i} className="px-3 py-2 text-sm text-white border-b border-gray-700 last:border-b-0">
                {item.trim()}
              </div>
            ))
          ) : (
            <div className="h-full" />
          )}
        </div>
      );
    }

    case 'Spinner': {
      return (
        <div className={`m-0.5 cursor-pointer ${selectionStyle} rounded ${isFillWidth(props) ? 'w-full' : 'inline-block'}`} onClick={wrapperClick}>
          <div
            className="flex items-center gap-1 border-b border-gray-400 px-1 py-1.5 bg-transparent"
            style={{ ...getDimensionStyle() }}
          >
            <span className="text-sm text-gray-500">{props.Selection || 'add items...'}</span>
            <span className="text-gray-400 text-xs ml-1">▼</span>
          </div>
        </div>
      );
    }

    case 'DatePicker':
    case 'TimePicker': {
      return (
        <div className={`m-0.5 cursor-pointer ${selectionStyle} rounded ${isFillWidth(props) ? 'w-full' : ''}`} onClick={wrapperClick}>
          <button
            className="rounded px-3 py-1.5 text-sm bg-[#6188a0] text-black border border-gray-400/30"
            style={{ ...getDimensionStyle() }}
          >
            {props.Text || (comp.$Type === 'DatePicker' ? 'Pick Date' : 'Pick Time')}
          </button>
        </div>
      );
    }

    case 'ListPicker': {
      const bgColor = parseColor(props.BackgroundColor) || '#6188a0';
      const textColor = parseColor(props.TextColor) || '#000000';
      return (
        <div className={`m-0.5 cursor-pointer ${selectionStyle} rounded ${isFillWidth(props) ? 'w-full' : ''}`} onClick={wrapperClick}>
          <button
            className="rounded px-3 py-1.5 text-sm font-medium border border-gray-400/30"
            style={{
              backgroundColor: bgColor,
              color: textColor,
              ...getDimensionStyle(),
            }}
          >
            {props.Text || 'Text for ListPicker1'}
          </button>
        </div>
      );
    }

    case 'WebViewer': {
      return (
        <div
          className={`m-0.5 cursor-pointer ${selectionStyle} rounded border border-gray-300 bg-white ${isFillWidth(props) ? 'w-full' : ''}`}
          onClick={wrapperClick}
          style={getDimensionStyle()}
        >
          <div className="h-40 flex flex-col items-center justify-center text-gray-400 text-sm">
            <span>WebViewer</span>
            <span className="text-xs">{props.HomeUrl || ''}</span>
          </div>
        </div>
      );
    }

    case 'Canvas': {
      return (
        <div className={`m-0.5 cursor-pointer ${selectionStyle} rounded ${isFillWidth(props) ? 'w-full' : ''}`} onClick={wrapperClick}>
          <div
            className="bg-white border border-gray-300 flex items-center justify-center text-gray-400 text-sm rounded"
            style={{
              width: parseDimension(props.Width) || '300px',
              height: parseDimension(props.Height) || '200px',
              backgroundColor: parseColor(props.BackgroundColor) || '#ffffff',
            }}
          >
            Canvas
          </div>
        </div>
      );
    }

    case 'VideoPlayer': {
      return (
        <div className={`m-0.5 cursor-pointer ${selectionStyle} rounded ${isFillWidth(props) ? 'w-full' : ''}`} onClick={wrapperClick}>
          <div
            className="bg-black flex items-center justify-center text-white text-sm rounded relative"
            style={{
              width: parseDimension(props.Width) || '300px',
              height: parseDimension(props.Height) || '180px',
              ...getDimensionStyle(),
            }}
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[16px] border-l-white ml-1" />
            </div>
            <span className="absolute bottom-1 right-2 text-[10px] text-white/50">VideoPlayer</span>
          </div>
        </div>
      );
    }

    case 'Ball': {
      const radius = parseInt(props.Radius) || 5;
      const paintColor = parseColor(props.PaintColor) || '#000000';
      const size = radius * 2;
      return (
        <div className={`m-0.5 cursor-pointer ${selectionStyle} inline-block`} onClick={wrapperClick}>
          <div
            className="rounded-full"
            style={{
              width: `${Math.max(size, 10)}px`,
              height: `${Math.max(size, 10)}px`,
              backgroundColor: paintColor,
            }}
          />
        </div>
      );
    }

    case 'ImageSprite': {
      const w = parseDimension(props.Width) || '50px';
      const h = parseDimension(props.Height) || '50px';
      return (
        <div className={`m-0.5 cursor-pointer ${selectionStyle} inline-block`} onClick={wrapperClick}>
          <div
            className="bg-gray-200 border border-dashed border-gray-400 flex items-center justify-center text-gray-400 text-[10px] rounded"
            style={{ width: w, height: h }}
          >
            Sprite
          </div>
        </div>
      );
    }

    case 'ContactPicker': {
      const bgColor = parseColor(props.BackgroundColor) || '#6188a0';
      const textColor = parseColor(props.TextColor) || '#000000';
      return (
        <div className={`m-0.5 cursor-pointer ${selectionStyle} rounded ${isFillWidth(props) ? 'w-full' : ''}`} onClick={wrapperClick}>
          <button
            className="rounded px-3 py-1.5 text-sm font-medium border border-gray-400/30"
            style={{
              backgroundColor: bgColor,
              color: textColor,
              ...getDimensionStyle(),
            }}
          >
            {props.Text || 'Pick Contact'}
          </button>
        </div>
      );
    }

    // Layout components
    case 'HorizontalArrangement':
    case 'HorizontalScrollArrangement': {
      const alignH = { '1': 'flex-start', '2': 'flex-end', '3': 'center' };
      const alignV = { '1': 'flex-start', '2': 'center', '3': 'flex-end' };
      const hasBg = props.BackgroundColor && parseColor(props.BackgroundColor);
      return (
        <div
          className={`m-0.5 cursor-pointer ${selectionStyle} rounded ${!hasBg ? 'border border-dashed border-blue-300' : ''} ${isFillWidth(props) ? 'w-full' : ''}`}
          onClick={wrapperClick}
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: alignH[props.AlignHorizontal] || 'flex-start',
            alignItems: alignV[props.AlignVertical] || 'flex-start',
            padding: '2px',
            gap: '2px',
            minHeight: '32px',
            backgroundColor: hasBg || undefined,
            ...getDimensionStyle(),
          }}
        >
          {(!comp.children || comp.children.length === 0) ? (
            <div className="flex-1 flex items-center justify-center text-blue-300 text-[10px] py-1">
              Horizontal
            </div>
          ) : (
            comp.children.map(child => (
              <ComponentRenderer key={child.Uuid} comp={child} selectedId={selectedId} onSelect={onSelect} parentDir="row" />
            ))
          )}
        </div>
      );
    }

    case 'VerticalArrangement':
    case 'VerticalScrollArrangement': {
      const alignH = { '1': 'flex-start', '2': 'flex-end', '3': 'center' };
      const alignV = { '1': 'flex-start', '2': 'center', '3': 'flex-end' };
      const hasBg = props.BackgroundColor && parseColor(props.BackgroundColor);
      return (
        <div
          className={`m-0.5 cursor-pointer ${selectionStyle} rounded ${!hasBg ? 'border border-dashed border-green-300' : ''} ${isFillWidth(props) ? 'w-full' : ''}`}
          onClick={wrapperClick}
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: alignV[props.AlignVertical] || 'flex-start',
            alignItems: alignH[props.AlignHorizontal] || 'stretch',
            padding: '2px',
            gap: '1px',
            minHeight: '32px',
            backgroundColor: hasBg || undefined,
            ...getDimensionStyle(),
          }}
        >
          {(!comp.children || comp.children.length === 0) ? (
            <div className="flex-1 flex items-center justify-center text-green-300 text-[10px] py-1">
              Vertical
            </div>
          ) : (
            comp.children.map(child => (
              <ComponentRenderer key={child.Uuid} comp={child} selectedId={selectedId} onSelect={onSelect} parentDir="column" />
            ))
          )}
        </div>
      );
    }

    case 'TableArrangement': {
      return (
        <div
          className={`m-0.5 cursor-pointer ${selectionStyle} rounded border border-dashed border-purple-300 min-h-[32px] p-1 ${isFillWidth(props) ? 'w-full' : ''}`}
          onClick={wrapperClick}
          style={getDimensionStyle()}
        >
          <div className="flex items-center justify-center text-purple-300 text-[10px]">
            Table ({props.Columns || 2}x{props.Rows || 2})
          </div>
          {comp.children && comp.children.map(child => (
            <ComponentRenderer key={child.Uuid} comp={child} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </div>
      );
    }

    // Non-visible components shouldn't render in the screen area
    default: {
      if (def && !def.isVisible) {
        return null; // handled in the tray below the phone
      }
      return (
        <div className={`m-0.5 cursor-pointer ${selectionStyle} rounded`} onClick={wrapperClick}>
          <div className="bg-gray-100 rounded px-2 py-1 text-sm text-gray-600 inline-block">
            {def?.icon || ''} {comp.$Name}
          </div>
        </div>
      );
    }
  }
}
