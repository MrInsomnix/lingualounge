# LinguaLounge Website

Modern static website for LinguaLounge.

## Pages

- `index.html` - landing page
- `resources.html` - main resource overview
- `resources/german.html`, `resources/french.html`, `resources/russian.html`, `resources/spanish.html`, `resources/ukrainian.html`, `resources/italian.html`, `resources/polish.html` - language-specific resource pages
- `community.html`
- `rules.html`
- `faq.html`
- `join.html`

## Resource structure

Resources are separated by language and type:

- PDFs: `pdfs/<language>/files.json`
- Website links: `website-links/<language>/links.json`
- YouTube links: `youtube-links/<language>/links.json`

The website reads these JSON files automatically when it is served through a web server. The counts on the resource overview and the language resource pages are calculated from the JSON entries.

Example website entry:

```json
{
  "title": "DW Learn German",
  "url": "https://learngerman.dw.com/",
  "descriptionKey": "res.website.desc",
  "tagKey": "res.tag.website"
}
```

Example PDF entry:

```json
{
  "titleKey": "res.reference.title",
  "descriptionKey": "res.reference.desc",
  "file": "german-reference-sheet.pdf",
  "tagKey": "res.tag.reference"
}
```

For PDFs, place the actual PDF file inside `pdfs/<language>/` and add or remove the matching entry in `files.json`.

## Language switch

The UI supports:

- English
- Deutsch
- Français
- Русский
- Español
- Українська
- Italiano
- Polski

The selected UI language is saved in the browser with `localStorage` so it remains active across pages.

## Theme switch

Dark and light mode are included. The selected theme is saved in the browser with `localStorage`.

## Local preview

Open with a small local server:

```bash
cd LinguaLounge_Website
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Do not preview by double-clicking the HTML file. Browsers usually block local JSON loading from `file://` paths.

## Notes

- No Impressum page.
- No privacy page.
- No upload form.
- No lesson pages and no public editor/upload UI.
- This is a static website and does not store or process personal data.
