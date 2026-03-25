import { useState } from 'react';
import { COMPONENTS } from '../lib/componentDefs';
import {
  Columns3, Rows3, LayoutGrid, Plus, Trash2, ChevronRight, ChevronDown,
  ArrowUpDown, GripVertical, Package, Copy, Smartphone
} from 'lucide-react';

// Pre-built layout patterns
const LAYOUT_PRESETS = [
  {
    id: 'header-content',
    name: 'Header + Content',
    icon: '📱',
    description: 'Title bar with scrollable content area',
    build: () => ({
      components: [
        {
          $Name: 'HeaderLayout',
          $Type: 'HorizontalArrangement',
          Uuid: generateId(),
          properties: { Width: '-2', Height: '60', BackgroundColor: '&HFF3F51B5', AlignVertical: '2' },
          children: [
            { $Name: 'TitleLabel', $Type: 'Label', Uuid: generateId(), properties: { Text: 'App Title', FontSize: '20.0', FontBold: 'True', TextColor: '&HFFFFFFFF', Width: '-2' }, children: [] },
          ]
        },
        {
          $Name: 'ContentLayout',
          $Type: 'VerticalScrollArrangement',
          Uuid: generateId(),
          properties: { Width: '-2', Height: '-2' },
          children: []
        }
      ],
      code: `when Screen1.Initialize {\n  // Your initialization code here\n}\n`,
    })
  },
  {
    id: 'form',
    name: 'Form Layout',
    icon: '📝',
    description: 'Input fields with labels and submit button',
    build: () => ({
      components: [
        {
          $Name: 'FormLayout',
          $Type: 'VerticalArrangement',
          Uuid: generateId(),
          properties: { Width: '-2', Height: '-2', AlignHorizontal: '1' },
          children: [
            { $Name: 'NameLabel', $Type: 'Label', Uuid: generateId(), properties: { Text: 'Name:', FontSize: '14.0', FontBold: 'True' }, children: [] },
            { $Name: 'NameInput', $Type: 'TextBox', Uuid: generateId(), properties: { Hint: 'Enter your name', Width: '-2' }, children: [] },
            { $Name: 'EmailLabel', $Type: 'Label', Uuid: generateId(), properties: { Text: 'Email:', FontSize: '14.0', FontBold: 'True' }, children: [] },
            { $Name: 'EmailInput', $Type: 'TextBox', Uuid: generateId(), properties: { Hint: 'Enter your email', Width: '-2' }, children: [] },
            { $Name: 'SubmitButton', $Type: 'Button', Uuid: generateId(), properties: { Text: 'Submit', Width: '-2', BackgroundColor: '&HFF3F51B5', TextColor: '&HFFFFFFFF', FontSize: '16.0' }, children: [] },
          ]
        }
      ],
      code: `when SubmitButton.Click {\n  if get NameInput.Text != "" {\n    call Notifier1.ShowAlert(join("Hello, ", get NameInput.Text))\n  } else {\n    call Notifier1.ShowAlert("Please enter your name")\n  }\n}\n`,
    })
  },
  {
    id: 'two-column',
    name: 'Two Columns',
    icon: '📊',
    description: 'Side by side columns layout',
    build: () => ({
      components: [
        {
          $Name: 'ColumnsLayout',
          $Type: 'HorizontalArrangement',
          Uuid: generateId(),
          properties: { Width: '-2', Height: '-2' },
          children: [
            {
              $Name: 'LeftColumn',
              $Type: 'VerticalArrangement',
              Uuid: generateId(),
              properties: { Width: '-2', Height: '-2' },
              children: [
                { $Name: 'LeftLabel', $Type: 'Label', Uuid: generateId(), properties: { Text: 'Left Column', FontBold: 'True' }, children: [] },
              ]
            },
            {
              $Name: 'RightColumn',
              $Type: 'VerticalArrangement',
              Uuid: generateId(),
              properties: { Width: '-2', Height: '-2' },
              children: [
                { $Name: 'RightLabel', $Type: 'Label', Uuid: generateId(), properties: { Text: 'Right Column', FontBold: 'True' }, children: [] },
              ]
            }
          ]
        }
      ],
      code: '',
    })
  },
  {
    id: 'list-detail',
    name: 'List + Detail',
    icon: '📋',
    description: 'List view with detail area below',
    build: () => ({
      components: [
        {
          $Name: 'MainLayout',
          $Type: 'VerticalArrangement',
          Uuid: generateId(),
          properties: { Width: '-2', Height: '-2' },
          children: [
            { $Name: 'TitleLabel', $Type: 'Label', Uuid: generateId(), properties: { Text: 'My List', FontSize: '20.0', FontBold: 'True', TextColor: '&HFF3F51B5', Width: '-2', TextAlignment: '1' }, children: [] },
            { $Name: 'ItemList', $Type: 'ListView', Uuid: generateId(), properties: { Width: '-2', Height: '250' }, children: [] },
            { $Name: 'DetailLabel', $Type: 'Label', Uuid: generateId(), properties: { Text: 'Select an item to see details', Width: '-2', TextAlignment: '1', FontItalic: 'True' }, children: [] },
          ]
        },
        { $Name: 'TinyDB1', $Type: 'TinyDB', Uuid: generateId(), properties: {}, children: [] },
      ],
      code: `when ItemList.AfterPicking {\n  set DetailLabel.Text = join("Selected: ", get ItemList.Selection)\n}\n`,
    })
  },
  {
    id: 'bottom-nav',
    name: 'Bottom Navigation',
    icon: '🔽',
    description: 'Content area with bottom button bar',
    build: () => ({
      components: [
        {
          $Name: 'ContentArea',
          $Type: 'VerticalArrangement',
          Uuid: generateId(),
          properties: { Width: '-2', Height: '-2' },
          children: [
            { $Name: 'ContentLabel', $Type: 'Label', Uuid: generateId(), properties: { Text: 'Content goes here', Width: '-2', Height: '-2', TextAlignment: '1' }, children: [] },
          ]
        },
        {
          $Name: 'BottomNav',
          $Type: 'HorizontalArrangement',
          Uuid: generateId(),
          properties: { Width: '-2', Height: '56', BackgroundColor: '&HFF3F51B5', AlignHorizontal: '3', AlignVertical: '2' },
          children: [
            { $Name: 'HomeBtn', $Type: 'Button', Uuid: generateId(), properties: { Text: 'Home', BackgroundColor: '&HFF3F51B5', TextColor: '&HFFFFFFFF' }, children: [] },
            { $Name: 'SearchBtn', $Type: 'Button', Uuid: generateId(), properties: { Text: 'Search', BackgroundColor: '&HFF3F51B5', TextColor: '&HFFFFFFFF' }, children: [] },
            { $Name: 'ProfileBtn', $Type: 'Button', Uuid: generateId(), properties: { Text: 'Profile', BackgroundColor: '&HFF3F51B5', TextColor: '&HFFFFFFFF' }, children: [] },
          ]
        }
      ],
      code: `when HomeBtn.Click {\n  set ContentLabel.Text = "Home Page"\n}\n\nwhen SearchBtn.Click {\n  set ContentLabel.Text = "Search Page"\n}\n\nwhen ProfileBtn.Click {\n  set ContentLabel.Text = "Profile Page"\n}\n`,
    })
  },
  {
    id: 'login',
    name: 'Login Screen',
    icon: '🔐',
    description: 'Username, password, and login button',
    build: () => ({
      components: [
        {
          $Name: 'LoginLayout',
          $Type: 'VerticalArrangement',
          Uuid: generateId(),
          properties: { Width: '-2', Height: '-2', AlignHorizontal: '3', AlignVertical: '2' },
          children: [
            { $Name: 'AppTitle', $Type: 'Label', Uuid: generateId(), properties: { Text: 'Login', FontSize: '28.0', FontBold: 'True', TextColor: '&HFF3F51B5', TextAlignment: '1', Width: '-2' }, children: [] },
            { $Name: 'UsernameInput', $Type: 'TextBox', Uuid: generateId(), properties: { Hint: 'Username', Width: '-2' }, children: [] },
            { $Name: 'PasswordInput', $Type: 'PasswordTextBox', Uuid: generateId(), properties: { Hint: 'Password', Width: '-2' }, children: [] },
            { $Name: 'LoginButton', $Type: 'Button', Uuid: generateId(), properties: { Text: 'Log In', Width: '-2', BackgroundColor: '&HFF3F51B5', TextColor: '&HFFFFFFFF', FontSize: '16.0', FontBold: 'True' }, children: [] },
            { $Name: 'StatusLabel', $Type: 'Label', Uuid: generateId(), properties: { Text: '', TextColor: '&HFFEF4444', Width: '-2', TextAlignment: '1' }, children: [] },
          ]
        },
        { $Name: 'TinyDB1', $Type: 'TinyDB', Uuid: generateId(), properties: {}, children: [] },
        { $Name: 'Notifier1', $Type: 'Notifier', Uuid: generateId(), properties: {}, children: [] },
      ],
      code: `when LoginButton.Click {\n  if get UsernameInput.Text == "" {\n    set StatusLabel.Text = "Please enter username"\n  } else {\n    if get PasswordInput.Text == "" {\n      set StatusLabel.Text = "Please enter password"\n    } else {\n      set StatusLabel.Text = ""\n      call Notifier1.ShowAlert("Logging in...")\n    }\n  }\n}\n`,
    })
  },
  {
    id: 'card-grid',
    name: 'Card Grid',
    icon: '🃏',
    description: '2x2 grid of card-like buttons',
    build: () => ({
      components: [
        {
          $Name: 'TitleBar',
          $Type: 'HorizontalArrangement',
          Uuid: generateId(),
          properties: { Width: '-2', Height: '50', BackgroundColor: '&HFF3F51B5', AlignVertical: '2' },
          children: [
            { $Name: 'PageTitle', $Type: 'Label', Uuid: generateId(), properties: { Text: 'Dashboard', FontSize: '18.0', FontBold: 'True', TextColor: '&HFFFFFFFF', Width: '-2', TextAlignment: '1' }, children: [] },
          ]
        },
        {
          $Name: 'GridLayout',
          $Type: 'VerticalArrangement',
          Uuid: generateId(),
          properties: { Width: '-2', Height: '-2', AlignHorizontal: '3' },
          children: [
            {
              $Name: 'Row1',
              $Type: 'HorizontalArrangement',
              Uuid: generateId(),
              properties: { Width: '-2', AlignHorizontal: '3' },
              children: [
                { $Name: 'Card1', $Type: 'Button', Uuid: generateId(), properties: { Text: 'Card 1', Width: '140', Height: '120', BackgroundColor: '&HFF6366F1', TextColor: '&HFFFFFFFF', FontSize: '16.0' }, children: [] },
                { $Name: 'Card2', $Type: 'Button', Uuid: generateId(), properties: { Text: 'Card 2', Width: '140', Height: '120', BackgroundColor: '&HFF22C55E', TextColor: '&HFFFFFFFF', FontSize: '16.0' }, children: [] },
              ]
            },
            {
              $Name: 'Row2',
              $Type: 'HorizontalArrangement',
              Uuid: generateId(),
              properties: { Width: '-2', AlignHorizontal: '3' },
              children: [
                { $Name: 'Card3', $Type: 'Button', Uuid: generateId(), properties: { Text: 'Card 3', Width: '140', Height: '120', BackgroundColor: '&HFFF59E0B', TextColor: '&HFFFFFFFF', FontSize: '16.0' }, children: [] },
                { $Name: 'Card4', $Type: 'Button', Uuid: generateId(), properties: { Text: 'Card 4', Width: '140', Height: '120', BackgroundColor: '&HFFEF4444', TextColor: '&HFFFFFFFF', FontSize: '16.0' }, children: [] },
              ]
            },
          ]
        },
      ],
      code: `when Card1.Click {\n  call Notifier1.ShowAlert("Card 1 clicked!")\n}\n\nwhen Card2.Click {\n  call Notifier1.ShowAlert("Card 2 clicked!")\n}\n\nwhen Card3.Click {\n  call Notifier1.ShowAlert("Card 3 clicked!")\n}\n\nwhen Card4.Click {\n  call Notifier1.ShowAlert("Card 4 clicked!")\n}\n`,
    })
  },
  {
    id: 'settings',
    name: 'Settings Page',
    icon: '⚙️',
    description: 'Toggle switches with labels',
    build: () => ({
      components: [
        {
          $Name: 'SettingsLayout',
          $Type: 'VerticalArrangement',
          Uuid: generateId(),
          properties: { Width: '-2', Height: '-2' },
          children: [
            { $Name: 'SettingsTitle', $Type: 'Label', Uuid: generateId(), properties: { Text: 'Settings', FontSize: '22.0', FontBold: 'True', TextColor: '&HFF3F51B5', Width: '-2' }, children: [] },
            {
              $Name: 'NotifRow',
              $Type: 'HorizontalArrangement',
              Uuid: generateId(),
              properties: { Width: '-2', AlignVertical: '2' },
              children: [
                { $Name: 'NotifLabel', $Type: 'Label', Uuid: generateId(), properties: { Text: 'Notifications', Width: '-2', FontSize: '16.0' }, children: [] },
                { $Name: 'NotifSwitch', $Type: 'Switch', Uuid: generateId(), properties: { On: 'True' }, children: [] },
              ]
            },
            {
              $Name: 'DarkRow',
              $Type: 'HorizontalArrangement',
              Uuid: generateId(),
              properties: { Width: '-2', AlignVertical: '2' },
              children: [
                { $Name: 'DarkLabel', $Type: 'Label', Uuid: generateId(), properties: { Text: 'Dark Mode', Width: '-2', FontSize: '16.0' }, children: [] },
                { $Name: 'DarkSwitch', $Type: 'Switch', Uuid: generateId(), properties: {}, children: [] },
              ]
            },
            {
              $Name: 'SoundRow',
              $Type: 'HorizontalArrangement',
              Uuid: generateId(),
              properties: { Width: '-2', AlignVertical: '2' },
              children: [
                { $Name: 'SoundLabel', $Type: 'Label', Uuid: generateId(), properties: { Text: 'Sound', Width: '-2', FontSize: '16.0' }, children: [] },
                { $Name: 'SoundSwitch', $Type: 'Switch', Uuid: generateId(), properties: { On: 'True' }, children: [] },
              ]
            },
            { $Name: 'VolumeLabel', $Type: 'Label', Uuid: generateId(), properties: { Text: 'Volume', FontSize: '16.0', Width: '-2' }, children: [] },
            { $Name: 'VolumeSlider', $Type: 'Slider', Uuid: generateId(), properties: { Width: '-2', MinValue: '0', MaxValue: '100', ThumbPosition: '75' }, children: [] },
          ]
        },
        { $Name: 'Notifier1', $Type: 'Notifier', Uuid: generateId(), properties: {}, children: [] },
      ],
      code: `when NotifSwitch.Changed {\n  if get NotifSwitch.On {\n    call Notifier1.ShowAlert("Notifications enabled")\n  } else {\n    call Notifier1.ShowAlert("Notifications disabled")\n  }\n}\n`,
    })
  }
];

let idCounter = -1000;
function generateId() {
  return String(idCounter--);
}

export default function LayoutBuilder({ onApplyPreset, components, onAddComponent, onWrapInLayout, selectedId }) {
  const [activeTab, setActiveTab] = useState('presets');

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--color-border)] bg-[var(--color-surface-light)]">
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'presets' ? 'text-[var(--color-primary-light)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-text-dim)]'
          }`}
        >
          Layout Presets
        </button>
        <button
          onClick={() => setActiveTab('quick')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'quick' ? 'text-[var(--color-primary-light)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-text-dim)]'
          }`}
        >
          Quick Build
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'code' ? 'text-[var(--color-primary-light)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-text-dim)]'
          }`}
        >
          Code Layout
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'presets' && (
          <PresetsPanel onApply={onApplyPreset} />
        )}
        {activeTab === 'quick' && (
          <QuickBuildPanel
            components={components}
            onAdd={onAddComponent}
            onWrap={onWrapInLayout}
            selectedId={selectedId}
          />
        )}
        {activeTab === 'code' && (
          <CodeLayoutPanel />
        )}
      </div>
    </div>
  );
}

function PresetsPanel({ onApply }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--color-text-dim)] mb-3">
        Click a preset to replace your current screen with a pre-built layout. This also adds starter code.
      </p>
      {LAYOUT_PRESETS.map(preset => (
        <button
          key={preset.id}
          onClick={() => {
            // Reset the id counter for fresh ids
            idCounter = -Math.floor(Math.random() * 900000) - 100000;
            const result = preset.build();
            onApply(result);
          }}
          className="w-full text-left p-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface)] transition-all group"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{preset.icon}</span>
            <div>
              <div className="text-sm font-medium text-[var(--color-text)] group-hover:text-[var(--color-primary-light)]">
                {preset.name}
              </div>
              <div className="text-xs text-[var(--color-text-dim)]">{preset.description}</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function QuickBuildPanel({ components, onAdd, onWrap, selectedId }) {
  const quickLayouts = [
    { type: 'VerticalArrangement', label: 'Vertical', icon: <Rows3 className="w-4 h-4" />, desc: 'Stack children top to bottom' },
    { type: 'HorizontalArrangement', label: 'Horizontal', icon: <Columns3 className="w-4 h-4" />, desc: 'Place children side by side' },
    { type: 'VerticalScrollArrangement', label: 'V-Scroll', icon: <ArrowUpDown className="w-4 h-4" />, desc: 'Scrollable vertical container' },
    { type: 'HorizontalScrollArrangement', label: 'H-Scroll', icon: <ArrowUpDown className="w-4 h-4 rotate-90" />, desc: 'Scrollable horizontal container' },
    { type: 'TableArrangement', label: 'Table', icon: <LayoutGrid className="w-4 h-4" />, desc: 'Grid layout' },
  ];

  const quickComponents = [
    { type: 'Button', label: 'Button', icon: '🔘' },
    { type: 'Label', label: 'Label', icon: '🏷️' },
    { type: 'TextBox', label: 'TextBox', icon: '📝' },
    { type: 'Image', label: 'Image', icon: '🖼️' },
    { type: 'ListView', label: 'ListView', icon: '📋' },
    { type: 'CheckBox', label: 'CheckBox', icon: '☑️' },
    { type: 'Switch', label: 'Switch', icon: '🔀' },
    { type: 'Slider', label: 'Slider', icon: '🎚️' },
    { type: 'Spinner', label: 'Spinner', icon: '🔽' },
    { type: 'Notifier', label: 'Notifier', icon: '🔔' },
    { type: 'TinyDB', label: 'TinyDB', icon: '💾' },
    { type: 'Clock', label: 'Clock', icon: '⏰' },
  ];

  return (
    <div className="space-y-4">
      {/* Wrap in layout */}
      {selectedId && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-dim)] mb-2">Wrap Selected In:</h4>
          <div className="grid grid-cols-2 gap-1">
            {quickLayouts.slice(0, 2).map(layout => (
              <button
                key={layout.type}
                onClick={() => onWrap(selectedId, layout.type)}
                className="flex items-center gap-1.5 p-2 text-xs rounded border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface)] transition-colors"
              >
                {layout.icon}
                <span>{layout.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add layouts */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-dim)] mb-2">Add Layout</h4>
        <div className="space-y-1">
          {quickLayouts.map(layout => (
            <button
              key={layout.type}
              onClick={() => onAdd(layout.type)}
              className="w-full flex items-center gap-2 p-2 text-sm rounded hover:bg-[var(--color-surface)] transition-colors group"
            >
              <span className="text-[var(--color-primary-light)]">{layout.icon}</span>
              <div className="text-left">
                <div className="text-[var(--color-text)]">{layout.label}</div>
                <div className="text-[10px] text-[var(--color-text-dim)]">{layout.desc}</div>
              </div>
              <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 text-[var(--color-primary-light)]" />
            </button>
          ))}
        </div>
      </div>

      {/* Quick add components */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-dim)] mb-2">Add Component</h4>
        <div className="grid grid-cols-3 gap-1">
          {quickComponents.map(comp => (
            <button
              key={comp.type}
              onClick={() => onAdd(comp.type)}
              className="flex flex-col items-center gap-0.5 p-2 text-[10px] rounded hover:bg-[var(--color-surface)] transition-colors text-[var(--color-text-dim)]"
            >
              <span className="text-base">{comp.icon}</span>
              {comp.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CodeLayoutPanel() {
  const examples = [
    {
      name: 'Basic Layout',
      code: `screen {
  Vertical(fill, fill, center) {
    Label("Hello World!", fontSize=24, bold)
    Button("Click Me", fill, bg=#3F51B5, color=#FFFFFF)
  }
}`,
    },
    {
      name: 'Form with Submit',
      code: `screen {
  Vertical(fill, fill) {
    Label("Sign Up", fontSize=22, bold, color=#3F51B5)
    Text(hint="Full Name", fill)
    Text(hint="Email", fill)
    Password(hint="Password", fill)
    Button("Create Account", fill, bg=#22C55E, color=#FFFFFF)
  }
  Notifier()
}`,
    },
    {
      name: 'Nav + Content',
      code: `screen {
  Vertical(fill, fill) {
    Horizontal(fill, h=50, bg=#3F51B5, centerV) {
      Label("My App", bold, color=#FFFFFF, fontSize=18)
    }
    VScroll(fill, fill) {
      Label("Page content goes here")
      Button("Action 1", fill)
      Button("Action 2", fill)
    }
    Horizontal(fill, h=50, bg=#3F51B5, center) {
      Button("Tab 1", color=#FFFFFF, bg=#3F51B5)
      Button("Tab 2", color=#FFFFFF, bg=#3F51B5)
      Button("Tab 3", color=#FFFFFF, bg=#3F51B5)
    }
  }
}`,
    },
  ];

  const [copiedIdx, setCopiedIdx] = useState(null);

  const handleCopy = (code, idx) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-[var(--color-text-dim)]">
        <p className="mb-2">Define your layout in the code editor using a <code className="px-1 py-0.5 bg-[var(--color-surface)] rounded text-[var(--color-primary-light)]">screen {'{ }'}</code> block. This replaces manual component adding.</p>
        <p className="mb-2 font-medium text-[var(--color-text)]">Quick syntax:</p>
        <ul className="space-y-1 ml-2">
          <li><code className="text-[var(--color-primary-light)]">Vertical</code> / <code className="text-[var(--color-primary-light)]">V</code> — VerticalArrangement</li>
          <li><code className="text-[var(--color-primary-light)]">Horizontal</code> / <code className="text-[var(--color-primary-light)]">H</code> — HorizontalArrangement</li>
          <li><code className="text-[var(--color-primary-light)]">fill</code> — Width: fill parent</li>
          <li><code className="text-[var(--color-primary-light)]">fillH</code> — Height: fill parent</li>
          <li><code className="text-[var(--color-primary-light)]">w=120</code> / <code className="text-[var(--color-primary-light)]">h=200</code> — size in px</li>
          <li><code className="text-[var(--color-primary-light)]">bg=#3F51B5</code> — background color</li>
          <li><code className="text-[var(--color-primary-light)]">color=#FFF</code> — text color</li>
          <li><code className="text-[var(--color-primary-light)]">bold</code> — bold text</li>
          <li><code className="text-[var(--color-primary-light)]">center</code> — center alignment</li>
          <li><code className="text-[var(--color-primary-light)]">as Name</code> — custom name</li>
        </ul>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-dim)] mb-2">Examples (click to copy)</h4>
        {examples.map((ex, idx) => (
          <div key={idx} className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[var(--color-text)]">{ex.name}</span>
              <button
                onClick={() => handleCopy(ex.code, idx)}
                className="text-[10px] text-[var(--color-primary-light)] hover:underline"
              >
                {copiedIdx === idx ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="text-[11px] font-mono bg-[var(--color-surface)] rounded p-2 text-[var(--color-primary-light)] whitespace-pre overflow-x-auto cursor-pointer hover:ring-1 hover:ring-[var(--color-primary)]"
              onClick={() => handleCopy(ex.code, idx)}
            >
              {ex.code}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
