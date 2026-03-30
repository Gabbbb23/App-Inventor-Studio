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
  set CountLabel.Text = join("", count)
}

when MinusButton.Click {
  count = count - 1
  set CountLabel.Text = join("", count)
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
  {
    id: 'ridetracker',
    name: 'Ride Tracker',
    description: 'Location-based ride booking with Firebase real-time updates',
    icon: '🚗',
    screens: [
      {
        name: 'Screen1',
        title: 'RideTracker',
        properties: {},
        components: [
          {
            $Name: 'VerticalArrangement1',
            $Type: 'VerticalArrangement',
            Uuid: '-600',
            properties: { Width: '-2', Height: '-2' },
            children: [
              // Header bar
              {
                $Name: 'HeaderBar',
                $Type: 'HorizontalArrangement',
                Uuid: '-601',
                properties: { Width: '-2', Height: '56', BackgroundColor: '&HFF3F51B5', AlignHorizontal: '3', AlignVertical: '2' },
                children: [
                  {
                    $Name: 'TitleLabel',
                    $Type: 'Label',
                    Uuid: '-602',
                    properties: { Text: 'RideTracker', FontSize: '20.0', FontBold: 'True', TextColor: '&HFFFFFFFF' },
                    children: []
                  }
                ]
              },
              // Role selector bar
              {
                $Name: 'RoleBar',
                $Type: 'HorizontalArrangement',
                Uuid: '-603',
                properties: { Width: '-2', Height: '48', BackgroundColor: '&HFF1E293B', AlignHorizontal: '3', AlignVertical: '2' },
                children: [
                  {
                    $Name: 'CustomerBtn',
                    $Type: 'Button',
                    Uuid: '-604',
                    properties: { Text: 'Customer', BackgroundColor: '&HFF22C55E', TextColor: '&HFFFFFFFF', Width: '140' },
                    children: []
                  },
                  {
                    $Name: 'DriverBtn',
                    $Type: 'Button',
                    Uuid: '-605',
                    properties: { Text: 'Driver', BackgroundColor: '&HFF3B82F6', TextColor: '&HFFFFFFFF', Width: '140' },
                    children: []
                  }
                ]
              },
              // ====== Customer Panel ======
              {
                $Name: 'CustomerPanel',
                $Type: 'VerticalArrangement',
                Uuid: '-606',
                properties: { Width: '-2', Height: '-2', Visible: 'True' },
                children: [
                  {
                    $Name: 'Map1',
                    $Type: 'Map',
                    Uuid: '-607',
                    properties: { Width: '-2', Height: '220', ZoomLevel: '15', ShowZoom: 'True', ShowUser: 'True' },
                    children: [
                      {
                        $Name: 'MyMarker',
                        $Type: 'Marker',
                        Uuid: '-608',
                        properties: { Title: 'My Location', FillColor: '&HFF22C55E' },
                        children: []
                      },
                      {
                        $Name: 'DriverMarker',
                        $Type: 'Marker',
                        Uuid: '-609',
                        properties: { Title: 'Driver', FillColor: '&HFF3B82F6' },
                        children: []
                      }
                    ]
                  },
                  {
                    $Name: 'LocationLabel',
                    $Type: 'Label',
                    Uuid: '-610',
                    properties: { Text: 'Location: Waiting for GPS...', FontSize: '12.0', TextColor: '&HFF6B7280', Width: '-2' },
                    children: []
                  },
                  {
                    $Name: 'PickupInput',
                    $Type: 'TextBox',
                    Uuid: '-611',
                    properties: { Hint: 'Enter pickup location', Width: '-2' },
                    children: []
                  },
                  {
                    $Name: 'DestInput',
                    $Type: 'TextBox',
                    Uuid: '-612',
                    properties: { Hint: 'Enter destination', Width: '-2' },
                    children: []
                  },
                  {
                    $Name: 'BookBtn',
                    $Type: 'Button',
                    Uuid: '-613',
                    properties: { Text: 'Book Ride', Width: '-2', BackgroundColor: '&HFF22C55E', TextColor: '&HFFFFFFFF', FontBold: 'True', FontSize: '16.0' },
                    children: []
                  },
                  {
                    $Name: 'StatusLabel',
                    $Type: 'Label',
                    Uuid: '-614',
                    properties: { Text: 'Status: Idle', Width: '-2', TextAlignment: '1', FontSize: '14.0', TextColor: '&HFF3F51B5' },
                    children: []
                  },
                  {
                    $Name: 'CancelBtn',
                    $Type: 'Button',
                    Uuid: '-615',
                    properties: { Text: 'Cancel Ride', Width: '-2', BackgroundColor: '&HFFEF4444', TextColor: '&HFFFFFFFF' },
                    children: []
                  }
                ]
              },
              // ====== Driver Panel ======
              {
                $Name: 'DriverPanel',
                $Type: 'VerticalArrangement',
                Uuid: '-620',
                properties: { Width: '-2', Height: '-2', Visible: 'False' },
                children: [
                  {
                    $Name: 'Map2',
                    $Type: 'Map',
                    Uuid: '-621',
                    properties: { Width: '-2', Height: '220', ZoomLevel: '15', ShowZoom: 'True', ShowUser: 'True' },
                    children: [
                      {
                        $Name: 'DriverSelfMarker',
                        $Type: 'Marker',
                        Uuid: '-622',
                        properties: { Title: 'My Location', FillColor: '&HFF3B82F6' },
                        children: []
                      },
                      {
                        $Name: 'CustomerMarker',
                        $Type: 'Marker',
                        Uuid: '-623',
                        properties: { Title: 'Customer', FillColor: '&HFF22C55E' },
                        children: []
                      }
                    ]
                  },
                  {
                    $Name: 'DriverLocLabel',
                    $Type: 'Label',
                    Uuid: '-624',
                    properties: { Text: 'Location: Waiting for GPS...', FontSize: '12.0', TextColor: '&HFF6B7280', Width: '-2' },
                    children: []
                  },
                  {
                    $Name: 'BookingLabel',
                    $Type: 'Label',
                    Uuid: '-625',
                    properties: { Text: 'No active bookings', FontSize: '16.0', FontBold: 'True', Width: '-2', TextAlignment: '1' },
                    children: []
                  },
                  {
                    $Name: 'RideInfoLabel',
                    $Type: 'Label',
                    Uuid: '-626',
                    properties: { Text: '', FontSize: '13.0', TextColor: '&HFF6B7280', Width: '-2' },
                    children: []
                  },
                  {
                    $Name: 'BtnRow',
                    $Type: 'HorizontalArrangement',
                    Uuid: '-627',
                    properties: { Width: '-2', AlignHorizontal: '3' },
                    children: [
                      {
                        $Name: 'AcceptBtn',
                        $Type: 'Button',
                        Uuid: '-628',
                        properties: { Text: 'Accept', BackgroundColor: '&HFF22C55E', TextColor: '&HFFFFFFFF', FontBold: 'True', Width: '140' },
                        children: []
                      },
                      {
                        $Name: 'RejectBtn',
                        $Type: 'Button',
                        Uuid: '-629',
                        properties: { Text: 'Reject', BackgroundColor: '&HFFF97316', TextColor: '&HFFFFFFFF', Width: '140' },
                        children: []
                      }
                    ]
                  },
                  {
                    $Name: 'DriverStatusLabel',
                    $Type: 'Label',
                    Uuid: '-630',
                    properties: { Text: 'Status: Available', Width: '-2', TextAlignment: '1', FontSize: '14.0', TextColor: '&HFF3B82F6' },
                    children: []
                  },
                  {
                    $Name: 'CompleteBtn',
                    $Type: 'Button',
                    Uuid: '-631',
                    properties: { Text: 'Complete Ride', Width: '-2', BackgroundColor: '&HFF3B82F6', TextColor: '&HFFFFFFFF', FontBold: 'True', FontSize: '16.0' },
                    children: []
                  }
                ]
              }
            ]
          },
          // Non-visible components
          {
            $Name: 'LocationSensor1',
            $Type: 'LocationSensor',
            Uuid: '-640',
            properties: { TimeInterval: '5000', DistanceInterval: '5' },
            children: []
          },
          {
            $Name: 'FirebaseDB1',
            $Type: 'FirebaseDB',
            Uuid: '-641',
            properties: { FirebaseURL: '', ProjectBucket: 'ridetracker' },
            children: []
          },
          {
            $Name: 'Clock1',
            $Type: 'Clock',
            Uuid: '-642',
            properties: { TimerInterval: '5000', TimerEnabled: 'True' },
            children: []
          },
          {
            $Name: 'Notifier1',
            $Type: 'Notifier',
            Uuid: '-643',
            properties: {},
            children: []
          }
        ],
        code: `var role = "customer"
var rideStatus = "idle"

when Screen1.Initialize {
  set Clock1.TimerInterval = 5000
  set Clock1.TimerEnabled = true
}

// ---- Role Switching ----

when CustomerBtn.Click {
  role = "customer"
  set CustomerPanel.Visible = true
  set DriverPanel.Visible = false
}

when DriverBtn.Click {
  role = "driver"
  set CustomerPanel.Visible = false
  set DriverPanel.Visible = true
  call FirebaseDB1.GetValue("ride_status", "idle")
}

// ---- GPS Location Updates ----

when LocationSensor1.LocationChanged(latitude, longitude, altitude, speed) {
  if role == "customer" {
    set LocationLabel.Text = join("Lat: ", join(latitude, join("  Lng: ", longitude)))
    call MyMarker.SetLocation(latitude, longitude)
    call Map1.PanTo(latitude, longitude, 15)
  } else {
    set DriverLocLabel.Text = join("Lat: ", join(latitude, join("  Lng: ", longitude)))
    call DriverSelfMarker.SetLocation(latitude, longitude)
    call Map2.PanTo(latitude, longitude, 15)
  }
}

// ---- Push Location to Firebase ----

when Clock1.Timer {
  if role == "customer" {
    call FirebaseDB1.StoreValue("cust_lat", join("", get LocationSensor1.Latitude))
    call FirebaseDB1.StoreValue("cust_lng", join("", get LocationSensor1.Longitude))
  } else {
    call FirebaseDB1.StoreValue("drv_lat", join("", get LocationSensor1.Latitude))
    call FirebaseDB1.StoreValue("drv_lng", join("", get LocationSensor1.Longitude))
  }
}

// ---- Customer: Book Ride ----

when BookBtn.Click {
  if get PickupInput.Text != "" {
    if get DestInput.Text != "" {
      call FirebaseDB1.StoreValue("ride_pickup", get PickupInput.Text)
      call FirebaseDB1.StoreValue("ride_dest", get DestInput.Text)
      call FirebaseDB1.StoreValue("ride_status", "waiting")
      rideStatus = "waiting"
      set StatusLabel.Text = "Waiting for driver..."
      set BookBtn.Enabled = false
      call Notifier1.ShowAlert("Ride booked!")
    } else {
      call Notifier1.ShowAlert("Enter a destination")
    }
  } else {
    call Notifier1.ShowAlert("Enter pickup location")
  }
}

// ---- Customer: Cancel Ride ----

when CancelBtn.Click {
  call FirebaseDB1.StoreValue("ride_status", "cancelled")
  rideStatus = "idle"
  set StatusLabel.Text = "Ride cancelled"
  set BookBtn.Enabled = true
}

// ---- Driver: Accept Ride ----

when AcceptBtn.Click {
  call FirebaseDB1.StoreValue("ride_status", "accepted")
  rideStatus = "accepted"
  set DriverStatusLabel.Text = "En route to pickup"
  call Notifier1.ShowAlert("Ride accepted!")
}

// ---- Driver: Reject Ride ----

when RejectBtn.Click {
  call FirebaseDB1.StoreValue("ride_status", "rejected")
  set DriverStatusLabel.Text = "Available"
  set BookingLabel.Text = "No bookings"
  set RideInfoLabel.Text = ""
}

// ---- Driver: Complete Ride ----

when CompleteBtn.Click {
  call FirebaseDB1.StoreValue("ride_status", "completed")
  rideStatus = "idle"
  set DriverStatusLabel.Text = "Available"
  set BookingLabel.Text = "Ride completed!"
  call Notifier1.ShowAlert("Ride completed!")
}

// ---- Firebase Real-Time Updates ----

when FirebaseDB1.DataChanged(tag, value) {
  if role == "customer" {
    if tag == "ride_status" {
      if value == "accepted" {
        set StatusLabel.Text = "Driver accepted!"
        call Notifier1.ShowAlert("Driver is on the way!")
      }
      if value == "completed" {
        set StatusLabel.Text = "Ride complete!"
        set BookBtn.Enabled = true
        rideStatus = "idle"
      }
      if value == "rejected" {
        set StatusLabel.Text = "Declined. Try again."
        set BookBtn.Enabled = true
        rideStatus = "idle"
      }
    }
    if tag == "drv_lat" {
      set DriverMarker.Latitude = value
    }
    if tag == "drv_lng" {
      set DriverMarker.Longitude = value
    }
  }
  if role == "driver" {
    if tag == "ride_status" {
      if value == "waiting" {
        set BookingLabel.Text = "New ride request!"
        call FirebaseDB1.GetValue("ride_pickup", "")
        call FirebaseDB1.GetValue("ride_dest", "")
        call Notifier1.ShowAlert("New booking!")
      }
      if value == "cancelled" {
        set BookingLabel.Text = "Cancelled by customer"
        set RideInfoLabel.Text = ""
        set DriverStatusLabel.Text = "Available"
      }
    }
    if tag == "cust_lat" {
      set CustomerMarker.Latitude = value
    }
    if tag == "cust_lng" {
      set CustomerMarker.Longitude = value
    }
  }
}

when FirebaseDB1.GotValue(tag, value) {
  if tag == "ride_pickup" {
    set RideInfoLabel.Text = join("From: ", value)
  }
  if tag == "ride_dest" {
    set RideInfoLabel.Text = join(get RideInfoLabel.Text, join("  To: ", value))
  }
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
