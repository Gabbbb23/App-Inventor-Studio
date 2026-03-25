export const TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank App',
    description: 'Start from scratch with an empty screen',
    icon: '📄',
    screens: [
      {
        name: 'Screen1',
        title: 'My App',
        properties: {},
        components: [],
        code: '// Write your code here\n// Example:\n// when Button1.Click {\n//   set Label1.Text = "Hello!"\n// }\n',
      }
    ]
  },
  {
    id: 'counter',
    name: 'Counter App',
    description: 'Simple counter with increment and decrement buttons',
    icon: '🔢',
    screens: [
      {
        name: 'Screen1',
        title: 'Counter',
        properties: {},
        components: [
          {
            $Name: 'VerticalArrangement1',
            $Type: 'VerticalArrangement',
            Uuid: '-100',
            properties: { Width: '-2', Height: '-2', AlignHorizontal: '3', AlignVertical: '2' },
            children: [
              {
                $Name: 'CountLabel',
                $Type: 'Label',
                Uuid: '-101',
                properties: { Text: '0', FontSize: '48.0', TextAlignment: '1', Width: '-2', TextColor: '&HFF3F51B5' },
                children: []
              },
              {
                $Name: 'HorizontalArrangement1',
                $Type: 'HorizontalArrangement',
                Uuid: '-102',
                properties: { Width: '-2', AlignHorizontal: '3' },
                children: [
                  {
                    $Name: 'MinusButton',
                    $Type: 'Button',
                    Uuid: '-103',
                    properties: { Text: ' - ', FontSize: '24.0', BackgroundColor: '&HFFEF4444', TextColor: '&HFFFFFFFF', Width: '100' },
                    children: []
                  },
                  {
                    $Name: 'PlusButton',
                    $Type: 'Button',
                    Uuid: '-104',
                    properties: { Text: ' + ', FontSize: '24.0', BackgroundColor: '&HFF22C55E', TextColor: '&HFFFFFFFF', Width: '100' },
                    children: []
                  }
                ]
              },
              {
                $Name: 'ResetButton',
                $Type: 'Button',
                Uuid: '-105',
                properties: { Text: 'Reset', BackgroundColor: '&HFF6B7280', TextColor: '&HFFFFFFFF', Width: '-2' },
                children: []
              }
            ]
          }
        ],
        code: `var count = 0

when PlusButton.Click {
  count = count + 1
  set CountLabel.Text = count
}

when MinusButton.Click {
  count = count - 1
  set CountLabel.Text = count
}

when ResetButton.Click {
  count = 0
  set CountLabel.Text = "0"
}`,
      }
    ]
  },
  {
    id: 'todo',
    name: 'To-Do List',
    description: 'Task list app with add, complete, and persistence',
    icon: '✅',
    screens: [
      {
        name: 'Screen1',
        title: 'To-Do List',
        properties: {},
        components: [
          {
            $Name: 'VerticalArrangement1',
            $Type: 'VerticalArrangement',
            Uuid: '-200',
            properties: { Width: '-2', Height: '-2' },
            children: [
              {
                $Name: 'TitleLabel',
                $Type: 'Label',
                Uuid: '-201',
                properties: { Text: 'My To-Do List', FontSize: '24.0', FontBold: 'True', TextColor: '&HFF3F51B5', Width: '-2', TextAlignment: '1' },
                children: []
              },
              {
                $Name: 'HorizontalArrangement1',
                $Type: 'HorizontalArrangement',
                Uuid: '-202',
                properties: { Width: '-2' },
                children: [
                  {
                    $Name: 'TaskInput',
                    $Type: 'TextBox',
                    Uuid: '-203',
                    properties: { Hint: 'Enter a task...', Width: '-2' },
                    children: []
                  },
                  {
                    $Name: 'AddButton',
                    $Type: 'Button',
                    Uuid: '-204',
                    properties: { Text: 'Add', BackgroundColor: '&HFF3F51B5', TextColor: '&HFFFFFFFF' },
                    children: []
                  }
                ]
              },
              {
                $Name: 'TaskListView',
                $Type: 'ListView',
                Uuid: '-205',
                properties: { Width: '-2', Height: '300' },
                children: []
              },
              {
                $Name: 'DeleteButton',
                $Type: 'Button',
                Uuid: '-206',
                properties: { Text: 'Delete Selected', BackgroundColor: '&HFFEF4444', TextColor: '&HFFFFFFFF', Width: '-2' },
                children: []
              }
            ]
          },
          {
            $Name: 'TinyDB1',
            $Type: 'TinyDB',
            Uuid: '-207',
            properties: {},
            children: []
          }
        ],
        code: `when Screen1.Initialize {
  var saved = call TinyDB1.GetValue("tasks", "")
  if saved != "" {
    set TaskListView.Elements = saved
  }
}

when AddButton.Click {
  if get TaskInput.Text != "" {
    set TaskListView.Elements = join(get TaskListView.Elements, get TaskInput.Text)
    set TaskInput.Text = ""
    call TinyDB1.StoreValue("tasks", get TaskListView.Elements)
  }
}

when DeleteButton.Click {
  if get TaskListView.SelectionIndex > 0 {
    call Notifier1.ShowAlert("Task deleted!")
  }
}`,
      }
    ]
  },
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'Basic calculator with standard operations',
    icon: '🔣',
    screens: [
      {
        name: 'Screen1',
        title: 'Calculator',
        properties: {},
        components: [
          {
            $Name: 'VerticalArrangement1',
            $Type: 'VerticalArrangement',
            Uuid: '-300',
            properties: { Width: '-2', Height: '-2', AlignHorizontal: '3' },
            children: [
              {
                $Name: 'DisplayLabel',
                $Type: 'Label',
                Uuid: '-301',
                properties: { Text: '0', FontSize: '36.0', TextAlignment: '2', Width: '-2', BackgroundColor: '&HFF1E293B', TextColor: '&HFFFFFFFF', Height: '80' },
                children: []
              },
              {
                $Name: 'Num1',
                $Type: 'Button',
                Uuid: '-302',
                properties: { Text: '1', FontSize: '24.0', Width: '80', Height: '80' },
                children: []
              },
              {
                $Name: 'Num2',
                $Type: 'Button',
                Uuid: '-303',
                properties: { Text: '2', FontSize: '24.0', Width: '80', Height: '80' },
                children: []
              },
              {
                $Name: 'Num3',
                $Type: 'Button',
                Uuid: '-304',
                properties: { Text: '3', FontSize: '24.0', Width: '80', Height: '80' },
                children: []
              },
              {
                $Name: 'AddBtn',
                $Type: 'Button',
                Uuid: '-305',
                properties: { Text: '+', FontSize: '24.0', Width: '80', Height: '80', BackgroundColor: '&HFF3F51B5', TextColor: '&HFFFFFFFF' },
                children: []
              },
              {
                $Name: 'EqualsBtn',
                $Type: 'Button',
                Uuid: '-310',
                properties: { Text: '=', FontSize: '24.0', Width: '-2', Height: '80', BackgroundColor: '&HFF22C55E', TextColor: '&HFFFFFFFF' },
                children: []
              },
              {
                $Name: 'ClearBtn',
                $Type: 'Button',
                Uuid: '-311',
                properties: { Text: 'C', FontSize: '24.0', Width: '-2', Height: '60', BackgroundColor: '&HFFEF4444', TextColor: '&HFFFFFFFF' },
                children: []
              }
            ]
          }
        ],
        code: `var currentNumber = ""
var previousNumber = ""
var operation = ""

when Num1.Click {
  currentNumber = join(currentNumber, "1")
  set DisplayLabel.Text = currentNumber
}

when Num2.Click {
  currentNumber = join(currentNumber, "2")
  set DisplayLabel.Text = currentNumber
}

when Num3.Click {
  currentNumber = join(currentNumber, "3")
  set DisplayLabel.Text = currentNumber
}

when AddBtn.Click {
  previousNumber = currentNumber
  currentNumber = ""
  operation = "+"
  set DisplayLabel.Text = "+"
}

when EqualsBtn.Click {
  if operation == "+" {
    set DisplayLabel.Text = previousNumber + currentNumber
  }
  currentNumber = ""
  previousNumber = ""
  operation = ""
}

when ClearBtn.Click {
  currentNumber = ""
  previousNumber = ""
  operation = ""
  set DisplayLabel.Text = "0"
}`,
      }
    ]
  },
  {
    id: 'quiz',
    name: 'Quiz App',
    description: 'Multiple choice quiz with scoring',
    icon: '❓',
    screens: [
      {
        name: 'Screen1',
        title: 'Quiz',
        properties: {},
        components: [
          {
            $Name: 'VerticalArrangement1',
            $Type: 'VerticalArrangement',
            Uuid: '-400',
            properties: { Width: '-2', Height: '-2', AlignHorizontal: '3' },
            children: [
              {
                $Name: 'ScoreLabel',
                $Type: 'Label',
                Uuid: '-401',
                properties: { Text: 'Score: 0', FontSize: '18.0', TextColor: '&HFF22C55E', Width: '-2' },
                children: []
              },
              {
                $Name: 'QuestionLabel',
                $Type: 'Label',
                Uuid: '-402',
                properties: { Text: 'What is 2 + 2?', FontSize: '24.0', FontBold: 'True', Width: '-2', TextAlignment: '1' },
                children: []
              },
              {
                $Name: 'OptionA',
                $Type: 'Button',
                Uuid: '-403',
                properties: { Text: 'A) 3', Width: '-2', FontSize: '18.0' },
                children: []
              },
              {
                $Name: 'OptionB',
                $Type: 'Button',
                Uuid: '-404',
                properties: { Text: 'B) 4', Width: '-2', FontSize: '18.0' },
                children: []
              },
              {
                $Name: 'OptionC',
                $Type: 'Button',
                Uuid: '-405',
                properties: { Text: 'C) 5', Width: '-2', FontSize: '18.0' },
                children: []
              },
              {
                $Name: 'ResultLabel',
                $Type: 'Label',
                Uuid: '-406',
                properties: { Text: '', FontSize: '20.0', Width: '-2', TextAlignment: '1' },
                children: []
              }
            ]
          },
          {
            $Name: 'Notifier1',
            $Type: 'Notifier',
            Uuid: '-407',
            properties: {},
            children: []
          }
        ],
        code: `var score = 0
var answer = "B"

when OptionA.Click {
  if "A" == answer {
    score = score + 1
    set ScoreLabel.Text = join("Score: ", score)
    call Notifier1.ShowAlert("Correct!")
  } else {
    call Notifier1.ShowAlert("Wrong! The answer was B) 4")
  }
}

when OptionB.Click {
  if "B" == answer {
    score = score + 1
    set ScoreLabel.Text = join("Score: ", score)
    call Notifier1.ShowAlert("Correct!")
  } else {
    call Notifier1.ShowAlert("Wrong!")
  }
}

when OptionC.Click {
  if "C" == answer {
    score = score + 1
    set ScoreLabel.Text = join("Score: ", score)
    call Notifier1.ShowAlert("Correct!")
  } else {
    call Notifier1.ShowAlert("Wrong! The answer was B) 4")
  }
}`,
      }
    ]
  },
  {
    id: 'notes',
    name: 'Notes App',
    description: 'Save and load notes with TinyDB',
    icon: '📝',
    screens: [
      {
        name: 'Screen1',
        title: 'My Notes',
        properties: {},
        components: [
          {
            $Name: 'VerticalArrangement1',
            $Type: 'VerticalArrangement',
            Uuid: '-500',
            properties: { Width: '-2', Height: '-2' },
            children: [
              {
                $Name: 'TitleLabel',
                $Type: 'Label',
                Uuid: '-501',
                properties: { Text: 'My Notes', FontSize: '24.0', FontBold: 'True', TextColor: '&HFF3F51B5', Width: '-2', TextAlignment: '1' },
                children: []
              },
              {
                $Name: 'NoteInput',
                $Type: 'TextBox',
                Uuid: '-502',
                properties: { Hint: 'Type your note here...', MultiLine: 'True', Width: '-2', Height: '200' },
                children: []
              },
              {
                $Name: 'HorizontalArrangement1',
                $Type: 'HorizontalArrangement',
                Uuid: '-503',
                properties: { Width: '-2', AlignHorizontal: '3' },
                children: [
                  {
                    $Name: 'SaveButton',
                    $Type: 'Button',
                    Uuid: '-504',
                    properties: { Text: 'Save', BackgroundColor: '&HFF22C55E', TextColor: '&HFFFFFFFF', Width: '120' },
                    children: []
                  },
                  {
                    $Name: 'LoadButton',
                    $Type: 'Button',
                    Uuid: '-505',
                    properties: { Text: 'Load', BackgroundColor: '&HFF3F51B5', TextColor: '&HFFFFFFFF', Width: '120' },
                    children: []
                  },
                  {
                    $Name: 'ClearButton',
                    $Type: 'Button',
                    Uuid: '-506',
                    properties: { Text: 'Clear', BackgroundColor: '&HFFEF4444', TextColor: '&HFFFFFFFF', Width: '120' },
                    children: []
                  }
                ]
              },
              {
                $Name: 'StatusLabel',
                $Type: 'Label',
                Uuid: '-507',
                properties: { Text: '', FontSize: '14.0', TextColor: '&HFF6B7280', Width: '-2', TextAlignment: '1' },
                children: []
              }
            ]
          },
          {
            $Name: 'TinyDB1',
            $Type: 'TinyDB',
            Uuid: '-508',
            properties: {},
            children: []
          },
          {
            $Name: 'Notifier1',
            $Type: 'Notifier',
            Uuid: '-509',
            properties: {},
            children: []
          }
        ],
        code: `when Screen1.Initialize {
  var saved = call TinyDB1.GetValue("note", "")
  if saved != "" {
    set NoteInput.Text = saved
    set StatusLabel.Text = "Note loaded from storage"
  }
}

when SaveButton.Click {
  call TinyDB1.StoreValue("note", get NoteInput.Text)
  set StatusLabel.Text = "Note saved!"
  call Notifier1.ShowAlert("Note saved successfully!")
}

when LoadButton.Click {
  var loaded = call TinyDB1.GetValue("note", "")
  set NoteInput.Text = loaded
  set StatusLabel.Text = "Note loaded!"
}

when ClearButton.Click {
  set NoteInput.Text = ""
  set StatusLabel.Text = "Cleared"
}`,
      }
    ]
  },
];

export function getTemplate(id) {
  return TEMPLATES.find(t => t.id === id);
}

export function applyTemplate(template) {
  // Deep clone the template so modifications don't affect the original
  return JSON.parse(JSON.stringify(template));
}
