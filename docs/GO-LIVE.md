# Go-live guide

The whole stack below runs on free plans. Expect about one to two hours of setup.

| Piece | Service | Free tier | Notes |
|---|---|---|---|
| Database | **MongoDB Atlas** M0 | 512 MB storage, shared cluster | Room for tens of thousands of bookings |
| Backend API | **Render** web service | 750 h/month | The free plan sleeps after 15 min idle, so the first request takes ~30–50 s. Starter is $7/mo and never sleeps; switch once you have real traffic |
| Website | **Vercel** | Hobby plan | Global CDN and HTTPS, deploys on every git push |
| Report PDFs | **Cloudflare R2** | 10 GB storage, no egress fees | Render's disk is wiped on every deploy, so reports **must** go to R2 in production |
| Email | **Gmail SMTP** with an app password | ~500 emails/day | Move to Brevo (300/day free) or Amazon SES once you outgrow it |
| Payments | **Direct UPI** (no gateway) | Free — no fees | Patients scan a QR and enter the UPI transaction ID; the receiver (you or the lab) confirms. Pay at collection also works |
| Domain | Any registrar | about ₹800/year for `.in` | The only paid item. Vercel and Render give free subdomains until then |

**AWS or MongoDB?** They are not alternatives. MongoDB Atlas is the database this app is built on, and it can itself run on AWS. Plain AWS (EC2, RDS, S3) is powerful, but its free tier only lasts 12 months and it takes far more setup and maintenance. Atlas, Render, Vercel and R2 cover the same needs for ₹0 to start.

## 1. Database: MongoDB Atlas
1. Go to https://cloud.mongodb.com, create a free **M0** cluster and pick the Mumbai (ap-south-1) region.
2. Under **Database Access**, add a user with a strong password.
3. Under **Network Access**, allow `0.0.0.0/0`. Render's free plan has no fixed IP.
4. Click **Connect → Drivers** and copy the URI. Add `/sanjibani` before the `?`:
   `mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/sanjibani?retryWrites=true&w=majority`

## 2. Report storage: Cloudflare R2
1. Sign up at https://dash.cloudflare.com, open **R2**, and create a bucket named `sanjibani-reports`. Keep it private.
2. Under **R2 → Manage API tokens**, create a token with *Object Read & Write* on that bucket.
3. Note these values:
   - Access Key ID and Secret Access Key
   - Endpoint: `https://<account-id>.r2.cloudflarestorage.com`

## 3. Email: Brevo (HTTPS API)
Render's free web services block outbound SMTP ports (25/465/587), so Gmail SMTP times out in production. Send over HTTPS instead:
1. Create a free account at https://www.brevo.com (300 emails/day, no card).
2. Under **Senders, domains & dedicated IPs**, add and verify the sender address (or authenticate the domain with its DKIM/DMARC records).
3. Under **SMTP & API → API keys**, create a key.
4. Set `BREVO_API_KEY` to the key and `EMAIL_FROM` to the verified sender.

For local development you can still use Gmail SMTP instead: set `EMAIL` and an app password (https://myaccount.google.com/apppasswords) as `EMAIL_PASSWORD`.

## 4. Backend: Render
1. Push this repo to GitHub.
2. In Render, click **New → Blueprint** and select the repo. `render.yaml` creates the `sanjibani-api` service.
3. Fill in the environment variables:

| Variable | Value |
|---|---|
| `MONGO_URI` | from step 1 |
| `JWT_SECRET` | Render generates this automatically |
| `CLIENT_ORIGINS` | your Vercel URL(s), comma-separated, e.g. `https://sanjibani.vercel.app,https://www.yourdomain.in` |
| `EMAIL_ENABLED` | `true` |
| `BREVO_API_KEY`, `EMAIL_FROM` | from step 3 |
| `STORAGE_DRIVER` | `s3` |
| `S3_BUCKET` | `sanjibani-reports` |
| `S3_REGION` | `auto` |
| `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | from step 2 |
| `UPI_ID`, `UPI_NAME` | your UPI ID and name — used for labs that have not added their own UPI ID |

4. After the first deploy, open `https://<service>.onrender.com/api/health`. It should return `{"status":"ok"}`.
5. Create your admin account. Do **not** run the demo seed in production. In the Render **Shell**, run:
   ```bash
   ADMIN_PASSWORD='a-strong-password' npm run create-admin -- --email you@domain.in --name "Your Name" --phone 98xxxxxxxx
   ```

## 5. Website: Vercel
1. In Vercel, click **Add New → Project**, select the repo, and set **Root Directory** to `frontend`. The framework (Vite) is detected automatically.
2. Set the environment variables from `frontend/.env.example`:
   - `VITE_API_URL=https://<service>.onrender.com/api`
   - your real support phone, WhatsApp number, email, company name, address and grievance officer
3. Deploy. Then add the Vercel URL to `CLIENT_ORIGINS` on Render and redeploy the API.
4. Optional: add your domain in Vercel under **Settings → Domains**.

## 6. Payments: free UPI
1. Set `UPI_ID` / `UPI_NAME` on Render (your UPI ID). Labs can add their own UPI ID in **Lab profile**; then patients pay the lab directly.
2. Patients scan the QR (amount and booking code pre-filled) and submit the 12-digit UTR.
3. Payments to your UPI ID are confirmed in **Admin → Bookings**; payments to a lab's UPI ID are confirmed by that lab in **Bookings**.
4. If you later want automatic confirmation for cards/net banking, a gateway such as Razorpay (~2% per payment) can be added back.

## 7. Before announcing
- [ ] Have a lawyer review `/legal/terms`, `/legal/privacy` and `/legal/refunds`. Health data falls under the DPDP Act, 2023.
- [ ] Sign agreements with partner labs, and verify each lab's licence and NABL certificate before approving it in the admin console.
- [ ] Place a real test booking end to end: book → lab confirms → upload report → download → pay.
- [ ] Remove or deactivate the demo coupons, or create your own in **Admin → Coupons**.
- [ ] Set up a free uptime monitor (UptimeRobot) on `/api/health`.
- [ ] Atlas M0 has no automatic backups. Export weekly with `mongodump`, or move to M10 when revenue allows.
