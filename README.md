# TrustArc Segment Wrapper

![image](https://github.com/user-attachments/assets/b4b11089-f701-4618-93e9-55a7cb21013e)


# Quick Start

## Configure TrustArc + Segment

### Requirements

Ensure that consent is enabled and that you have registered your integration-to-category mappings in Segment, which you can do through the Segment UI.

If you don't see a "Consent Management" option like the one below, please contact Segment's support or your Segment Solutions Engineer to have it enabled on your workspace.

<img width="957" alt="consent-mgmt-ui" src="https://github.com/user-attachments/assets/2ff19e45-188b-4e4d-90f4-91111c227272">

- Debugging hints: this library expects the TrustArc CCM script to be available in order to interact with TrustArc. This library derives the category IDs that are active for the current user from the `window.truste` object provided by TrustArc API. 
## For snippet users

### Add TrustArc's snippet and integration to your page

```html
<head>
  <!-- TrustArc Cookies Consent script start for trustarcdemo2.com -->
  <script async="async" type="text/javascript" crossorigin="" src='//consent.trustarc.com/notice?domain=trustarcdemo2.com&c=teconsent&js=nj&noticeType=bb&gtm=1&'></script>

  <!-- Add Segment's TrustArc Consent Wrapper -->
  <script src="https://consent.trustarc.com/get?name=trustarc_segment_wrapper.js"></script>

  <!--
    Add / Modify Segment Analytics Snippet
    * Find and replace: analytics.load('<MY_WRITE_KEY'>) -> TrustArcWrapper.withTrustArc(analytics).load('<MY_WRITE_KEY'>)
  -->
  <script>
    !function(){var analytics=window.analytics...
    ....
    TrustArcWrapper.withTrustArc(analytics).load('<MY_WRITE_KEY'>) // replace analytics.load()
    analytics.page()
  </script>
</head>
```

#### ⚠️ Reminder: _you must modify_ `analytics.load('....')` from the original Segment snippet. See markup comment in example above.

## Settings

### Consent Models

- **opt-in** - (strict, GDPR scenario) -- wait for explicit consent (i.e. alert box to be closed) before loading device mode destinations and initializing Segment. If consent is not given (no mapped categories are consented to), then Segment is not loaded.

- **opt-out** - Load segment immediately and all destinations, based on default categories. For device mode destinations, any analytics.js-originated events (e.g analytics.track) will be filtered based on consent.

- **default/other** - opt-out

This wrapper uses the `EU | US` values from the notice_behavior cookie consent model for a given geolocation. Default behavior can be overridden by doing:

```ts
TrustArcWrapper.withTrustArc(analytics, { consentModel: () => 'opt-in' | 'opt-out' })
  .load({ writeKey: '<MY_WRITE_KEY>' })
```

## Environments

### Build Artifacts

- We build the following versions of the library

| Format | Description | Path |
|--------|-------------|------|
| `amd` (amd bundle) | When a AMD bundle is required | `trustarc_segment_wrapper.js` |

### Browser Support
- `amd` - Support back to IE11, but **do not** polyfill . See our docs on [supported browsers](https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/supported-browsers).

In order to get full ie11 support, you are expected to bring your own polyfills. e.g. adding the following to your script tag:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/7.7.0/polyfill.min.js"></script>
```
