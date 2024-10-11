# TrustArc Segment Wrapper

![image](https://github.com/user-attachments/assets/b4b11089-f701-4618-93e9-55a7cb21013e)


# Quick Start

## Configure TrustArc + Segment

### Requirements

Ensure that consent is enabled and that you have registered your integration-to-category mappings in Segment, which you can do through the Segment UI.

If you don't see a "Consent Management" option like the one below, please contact Segment's support or your Segment Solutions Engineer to have it enabled on your workspace.

<img width="1138" alt="Screenshot 2024-09-26 at 10 51 23 AM" src="https://github.com/user-attachments/assets/61838cf1-b5e9-45ea-8a04-5c400ad88781">


- Debugging hints: this library expects the TrustArc CCM script to be available in order to interact with TrustArc. This library derives the category IDs that are active for the current user from the `window.truste` object provided by TrustArc API. 
## For snippet users

### Add TrustArc's snippet and integration to your page

```html
<head>

  <!-- TrustArc Cookies Consent script start for CCM Advanced -->
  <script async="async" type="text/javascript" crossorigin="" src='//consent.trustarc.com/notice?domain=<instanceid>&c=teconsent&js=nj&noticeType=bb&gtm=1&'></script>

  <!-- TrustArc Cookies Consent script start for CCM Pro -->
  <script type="text/javascript" async="async" src="https://consent.trustarc.com/v2/notice/<instanceid>"></script>


  <!-- Add Segment's TrustArc Consent Wrapper -->
  <script src="https://consent.trustarc.com/get?name=trustarc-segment-wrapper-v1.0.js"></script>

  <!--
    Add / Modify Segment Analytics Snippet
    * Find and replace: analytics.load('<MY_WRITE_KEY>') -> TrustArcWrapper.withTrustArc(analytics).load('<MY_WRITE_KEY'>)
  -->
  <script>
    !function(){var analytics=window.analytics...
    ....
    TrustArcWrapper.withTrustArc(analytics).load('<MY_WRITE_KEY>') // replace analytics.load()
    analytics.page()
  </script>
</head>
```

#### ⚠️ Reminder: _you must modify_ `analytics.load('....')` from the original Segment snippet. See markup comment in example above.

## For `npm` library users

1. Ensure that TrustArc Snippet is loaded.

2. Install both packages from your preferred package manager

```sh
# npm
npm install @trustarc/trustarc-segment-wrapper
npm install @segment/analytics-next

# yarn
yarn add @trustarc/trustarc-segment-wrapper
yarn add @segment/analytics-next   

# pnpm
pnpm add @trustarc/trustarc-segment-wrapper
pnpm add @segment/analytics-next   
```

3. Initialize alongside analytics

```ts
import { withTrustArc } from '@trustarc/trustarc-segment-wrapper'
import { AnalyticsBrowser } from '@segment/analytics-next'

export const analytics = new AnalyticsBrowser()

withTrustArc(analytics).load({ writeKey: '<MY_WRITE_KEY'> })

```
- Here is an example of how you can load the CCM script with `useEffect`
```ts
useEffect (() => {
    withTrustArc(analytics).load({ writeKey: '<MY_WRITE_KEY'>' })

    const taScript = document.createElement("script");
    taScript.src = "//consent.trustarc.com/notice?domain=<yourdomain.com>&c=teconsent&js=nj&noticeType=bb&gtm=1";
    document.head.appendChild(taScript);
   
    return () => {
      taScript.remove();
    }
  }, [])
```


## Settings

### Consent Models

- **opt-in** - (strict, GDPR scenario) -- wait for explicit consent (i.e. alert box to be closed) before loading device mode destinations and initializing Segment. If consent is not given (no mapped categories are consented to), then Segment is not loaded. Opt-in experience is the mapped for `EU` or `expressed` values in the notice behavior. See instructions below for more information.

- **opt-out** - Load segment immediately and all destinations, based on default categories. For device mode destinations, any analytics.js-originated events (e.g analytics.track) will be filtered based on consent.

- **default/other** - opt-out

This wrapper uses the `EU | US` values from the notice_behavior cookie dropped for the CCM Advanced and `EU | NA | AN | AF | AS | SA | OC` for CCM Pro consent model according to the consent geolocation. Please refer to the TrustArc integration guide for a more comprehensive overview of the available options. The default behavior can also be customized using your own logic:

```ts
TrustArcWrapper.withTrustArc(analytics, { consentModel: () => 'opt-in' | 'opt-out' })
  .load({ writeKey: '<MY_WRITE_KEY>' })
```

If you are using `implied | expressed` to define the consent experience, you can inform that using the parameter `consentModelBasedOnConsentExperience: true,`.

```ts
TrustArcWrapper.withTrustArc(analytics, { consentModelBasedOnConsentExperience: true })
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
