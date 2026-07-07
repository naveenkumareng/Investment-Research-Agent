# Currency Selection Fix - Visual Flow Diagrams

## 1. Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    App Root                              │
│                 (main.tsx)                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│              CurrencyProvider                            │
│         (context/currency-context.tsx)                 │
│                                                          │
│  ├─ currency: "USD" | "INR" | "EUR" | "GBP"            │
│  ├─ currencySymbol: "$" | "₹" | "€" | "£"             │
│  ├─ setCurrency()                                       │
│  └─ formatCurrency(amount)                             │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ↓            ↓            ↓
   ┌────────┐  ┌──────────┐  ┌────────────┐
   │Settings│  │Dashboard │  │ StockCard  │
   │ Page   │  │  Page    │  │  Component │
   │        │  │          │  │            │
   │Uses:   │  │Uses:     │  │Uses:       │
   │ - Form │  │ - format │  │ - format   │
   │ - Save │  │   Currency  │ Currency   │
   │ Button │  │            │            │
   └────────┘  └──────────┘  └────────────┘
```

---

## 2. Settings Page State Flow

```
User Opens Settings Page
         ↓
    useEffect()
         ↓
Load from localStorage
         ↓
Set initial state
  ├─ language: "en"
  ├─ localCurrency: "USD"
  ├─ notifications: {...}
  └─ hasChanges: false
         ↓
    Render UI
  ├─ Language dropdown
  ├─ Currency dropdown  (current value: USD)
  ├─ Notifications      (checkboxes)
  └─ No Save button     (hasChanges = false)
```

---

## 3. User Changes Currency

```
┌─────────────────────────────────┐
│ User selects "INR" from dropdown│
└────────────┬────────────────────┘
             ↓
    onChange event fired
             ↓
   handleCurrencyChange("INR")
             ↓
   setLocalCurrency("INR")
             ↓
   setHasChanges(true)
             ↓
   Re-render Settings UI
   ├─ Currency dropdown shows "INR"
   ├─ Warning appears: ⚠️ Unsaved changes
   └─ "Save Changes" button appears ✅
```

---

## 4. User Clicks Save Changes

```
┌──────────────────────────────────┐
│ User clicks "Save Changes" button│
└────────────┬─────────────────────┘
             ↓
  handleSaveChanges() triggered
             ↓
  setIsSaving(true)
             ↓
  Button shows: ⟳ Saving...
  Button disabled
             ↓
  600ms delay (for UX)
             ↓
  Save to localStorage
  ├─ app_language: "en"
  ├─ app_currency: "INR"  ← NEW VALUE
  └─ app_notifications: {...}
             ↓
  setGlobalCurrency("INR")
  ├─ Updates context value
  ├─ Notifies all subscribers
  └─ Broadcasts event
             ↓
  setHasChanges(false)
  setIsSaving(false)
             ↓
  Show success toast
  "Settings saved successfully!
   Currency changed to INR"
             ↓
  Button disappears
  UI ready for next change
```

---

## 5. Global Context Updates

```
Settings Page Calls setGlobalCurrency("INR")
         ↓
   CurrencyContext value changes
         ↓
   All subscribers notified
         ↓
┌──────────────────────────────┐
│  Components using useCurrency│
│  re-render with new value     │
│                               │
│  ├─ Dashboard (gets "INR")   │
│  ├─ StockCard (gets "INR")   │
│  ├─ Portfolio (gets "INR")   │
│  └─ All others...            │
└──────────────────────────────┘
         ↓
  All components see:
  ├─ currency = "INR"
  ├─ currencySymbol = "₹"
  └─ formatCurrency() returns ₹
         ↓
  All prices updated to show ₹
```

---

## 6. Data Persistence Flow

```
User saves currency "INR"
         ↓
┌─────────────────────────────────────┐
│     React Memory (Component State)   │
│                                     │
│     localCurrency: "INR"            │
│     currency (global): "INR"        │
└──────────────┬──────────────────────┘
               ↓
      setGlobalCurrency("INR")
               ↓
┌─────────────────────────────────────┐
│     localStorage (Browser Storage)  │
│                                     │
│     app_currency: "INR"             │
│     (Persists forever)              │
└──────────────┬──────────────────────┘
               ↓
    User refreshes page
               ↓
         App restarts
               ↓
   CurrencyProvider useEffect()
               ↓
   Loads from localStorage
               ↓
   setCurrency("INR")
               ↓
   All components get INR
```

---

## 7. Complete User Journey

```
┌─ START ─────────────────────────────────────────┐
│                                                  │
│ 1. User opens app                              │
│    └─> CurrencyProvider loads saved currency   │
│                                                │
│ 2. User navigates to Settings                  │
│    └─> Sees current: USD                       │
│                                                │
│ 3. User selects INR from dropdown              │
│    └─> Local state updates                     │
│    └─> Warning appears                         │
│    └─> Save button appears                     │
│                                                │
│ 4. User clicks Save Changes                    │
│    └─> Button shows loading spinner            │
│    └─> Data saves to localStorage              │
│    └─> Global context updates                  │
│    └─> Success toast shows                     │
│    └─> Button disappears                       │
│                                                │
│ 5. User navigates to Dashboard                 │
│    └─> All prices show ₹ symbol                │
│                                                │
│ 6. User navigates to Stock detail              │
│    └─> Stock prices show ₹ symbol              │
│                                                │
│ 7. User refreshes page                         │
│    └─> App reloads                             │
│    └─> localStorage loaded                     │
│    └─> Currency still INR                      │
│    └─> Prices still show ₹                     │
│                                                │
│ 8. User returns to Settings                    │
│    └─> Dropdown shows INR (saved value)        │
│                                                │
└─ SUCCESS ───────────────────────────────────────┘
```

---

## 8. Error Handling Flow

```
User clicks Save Changes
         ↓
   handleSaveChanges()
         ↓
   Try block executed
         ↓
   ┌─────────────────────────┐
   │ Something goes wrong    │
   │ (network, etc)          │
   └─────────┬───────────────┘
             ↓
   Catch block triggered
             ↓
   setIsSaving(false)
             ↓
   Show error toast
   "Failed to save settings
    Please try again"
             ↓
   User still sees:
   ├─ Warning message
   ├─ Save button (enabled)
   └─> Can retry
```

---

## 9. Storage Keys Hierarchy

```
┌────────────────────────────────────────────┐
│         Browser Preferences                │
└────────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    ↓            ↓            ↓
app_language  app_currency  app_notifications
    │            │            │
   "en"         "INR"        {email, push,
                              alerts}

localStorage is permanent unless:
  ├─ User clears cache
  ├─ App deletes it
  └─ Explicit logout
```

---

## 10. Type Flow

```
Start: Currency selection from dropdown
       value: "INR" (string)
         ↓
    Type check in handler
         ↓
    Type assertion to union
       as "USD" | "INR" | "EUR" | "GBP"
         ↓
    Stored in typed context
       currency: Currency
         ↓
    Returned from useCurrency()
       type safe throughout app
         ↓
    TypeScript compiler validates
       all usages are correct
         ↓
End: No runtime errors for currency
```

---

## 11. Request/Response Timeline

```
                User Action                 App Response
┌─────────────────────────┐
│ 1. Open Settings      │──┐
│                         │  └──> Load localStorage [instant]
│                         │
│ 2. Select INR          │──┐
│                         │  └──> Update UI [instant]
│                         │
│ 3. Click Save          │──┐
│                         │  └──> Show spinner [instant]
│                         │      └──> Wait 600ms [simulated save]
│                         │      └──> Save to localStorage [instant]
│                         │      └──> Update context [instant]
│                         │      └──> Show toast [instant]
│                         │      └──> Hide button [instant]
│                         │
└─────────────────────────┘

Total time: ~650ms (user sees "Saving..." state)
```

---

## 12. Component Interaction Diagram

```
┌──────────────────┐
│  Settings Page   │
│  SettingsGroup   │
│                  │
│  Forms UI        │ ────────> handleLanguageChange()
│  Dropdowns       │ ────────> handleCurrencyChange()  ──┐
│  Checkboxes      │ ────────> handleNotificationChange()│
│                  │                                      │
│  Save Button     │                                      │
│  (Sticky)        │                                      │
│                  │ <────────────────────────────────────┘
│                  │
│  onClick → handleSaveChanges()
│         ↓
│  localStorage.setItem()
│         ↓
│  setGlobalCurrency()
│         ↓
└──────────────────┘
         │
         ├─────────┬──────────┬────────────┐
         ↓         ↓          ↓            ↓
    ┌─────────┐ ┌──────┐ ┌─────────┐ ┌────────┐
    │Dashboard│ │Stock │ │Portfolio│ │Watchli│
    │         │ │Card  │ │         │ │st     │
    │ Uses    │ │ Uses │ │ Uses    │ │ Uses  │
    │currency │ │curre │ │currency │ │curre  │
    │ via hook│ │ncy   │ │ via hook│ │ncy    │
    └─────────┘ └──────┘ └─────────┘ └────────┘
         │         │          │            │
         └─────────┴──────────┴────────────┘
              │
         All receive
         updated value
         │
         formatCurrency()
         returns new symbol
```

---

## 13. State Management Summary

```
┌─────────────────────────────────────┐
│    React State (Temporary)          │
├─────────────────────────────────────┤
│ Settings Page:                      │
│  ├─ localCurrency: "INR"            │
│  ├─ hasChanges: true/false          │
│  ├─ isSaving: true/false            │
│  └─ language, notifications         │
└──────────┬──────────────────────────┘
           │ Click Save
           ↓
┌─────────────────────────────────────┐
│    Context State (Global)           │
├─────────────────────────────────────┤
│ CurrencyProvider:                   │
│  ├─ currency: "INR" (permanent)    │
│  ├─ currencySymbol: "₹"            │
│  ├─ formatCurrency()                │
│  └─ setCurrency()                   │
└──────────┬──────────────────────────┘
           │ Triggers subscribers
           ↓
┌─────────────────────────────────────┐
│    Browser Storage (Permanent)      │
├─────────────────────────────────────┤
│ localStorage:                       │
│  ├─ app_currency: "INR"            │
│  ├─ app_language: "en"              │
│  └─ app_notifications: {...}        │
└─────────────────────────────────────┘
```

---

## 14. Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        START HERE                            │
│                    App Initializes                           │
└────────────────────────┬────────────────────────────────────┘
                         ↓
        ┌────────────────────────────────────┐
        │  CurrencyProvider                  │
        │  useEffect on mount                │
        │  Reads localStorage                │
        └────────────────────┬───────────────┘
                             ↓
                    Sets initial currency
                             ↓
        ┌────────────────────────────────────┐
        │  All child components can now      │
        │  use useCurrency() hook            │
        │                                    │
        │  formatCurrency(1000)              │
        │  → "$1,000.00"                    │
        └────────────────────┬───────────────┘
                             ↓
        ┌────────────────────────────────────┐
        │  User navigates to Settings        │
        │  Settings page loads               │
        │  Reads current currency from       │
        │  context and localStorage          │
        └────────────────────┬───────────────┘
                             ↓
        ┌────────────────────────────────────┐
        │  User changes currency             │
        │  local state updated               │
        │  ⚠️ Warning appears                │
        │  💾 Save button appears            │
        └────────────────────┬───────────────┘
                             ↓
        ┌────────────────────────────────────┐
        │  User clicks "Save Changes"        │
        │  ⟳ Loading state                   │
        │  Saves to localStorage             │
        │  Updates global context            │
        │  ✅ Toast shows success            │
        │  💾 Button disappears              │
        └────────────────────┬───────────────┘
                             ↓
        ┌────────────────────────────────────┐
        │  All components subscribed to      │
        │  context get notified              │
        │  They re-render with new currency  │
        │  Prices update everywhere          │
        └────────────────────┬───────────────┘
                             ↓
        ┌────────────────────────────────────┐
        │  User refreshes page               │
        │  App restarts                      │
        │  CurrencyProvider reads localStorage
        │  Loads saved currency              │
        │  Settings persist                  │
        └────────────────────────────────────┘
```

---

## Key Takeaways

### Before Fix

```
Settings UI → Local State (component) → Lost on refresh ❌
```

### After Fix

```
Settings UI → Local State → localStorage → Context → All Components ✅
                ↓
        (Persists forever)
                ↓
        (Accessible everywhere)
                ↓
        (No data loss)
```

### The Three Layers

```
Layer 1: Component State      (Temporary, fast)
Layer 2: Global Context       (Shared, reactive)
Layer 3: localStorage         (Permanent, reliable)

All three work together for complete solution!
```

---

**Status**: ✅ All flows implemented and working
