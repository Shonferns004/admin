import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

const typeOptions = [
  { id: 'startup', label: 'Startup', icon: 'rocket_launch' },
  { id: 'local', label: 'Local Business', icon: 'storefront' },
  { id: 'individual', label: 'Individual', icon: 'person' },
]

const stepLabels = ['Find', 'Enrich', 'Score', 'Outreach']
const priorityOrder = { hot: 3, warm: 2, cold: 1 }
const ALL_LEADS_PAGE_SIZE = 6

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function safeJSON(raw) {
  let s = (raw || '').trim()
  s = s.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim()

  const arrIdx = s.indexOf('[')
  const objIdx = s.indexOf('{')
  if (arrIdx !== -1 && (objIdx === -1 || arrIdx < objIdx)) {
    const end = s.lastIndexOf(']')
    if (end !== -1) s = s.slice(arrIdx, end + 1)
  } else if (objIdx !== -1) {
    const end = s.lastIndexOf('}')
    if (end !== -1) s = s.slice(objIdx, end + 1)
  }

  let out = ''
  let inStr = false
  let esc = false
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (esc) {
      out += ch
      esc = false
      continue
    }
    if (inStr && ch === '\\') {
      out += ch
      esc = true
      continue
    }
    if (ch === '"') {
      inStr = !inStr
      out += ch
      continue
    }
    if (inStr && ch === '\n') {
      out += '\\n'
      continue
    }
    if (inStr && ch === '\r') {
      out += '\\r'
      continue
    }
    if (inStr && ch === '\t') {
      out += '\\t'
      continue
    }
    out += ch
  }

  s = out.replace(/,\s*([\]}])/g, '$1')
  return JSON.parse(s)
}

function normalizeGroqKey(value = '') {
  const text = String(value || '').trim()
  if (!text) return ''

  const gskIndex = text.indexOf('gsk_')
  if (gskIndex === -1) return text

  const fromPrefix = text.slice(gskIndex).trim()
  const match = fromPrefix.match(/^gsk_[A-Za-z0-9._-]+/)
  return match ? match[0] : fromPrefix
}

export default function Leads() {
  const [selectedTypes, setSelectedTypes] = useState(['startup', 'local', 'individual'])
  const [location, setLocation] = useState('Mumbai, India')
  const [industry, setIndustry] = useState('')
  const [product, setProduct] = useState('')
  const [numLeads, setNumLeads] = useState('5')
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState([{ text: 'Ready - select a Groq key and run lead generation', type: '' }])
  const [stepIndex, setStepIndex] = useState(1)
  const [allStepsDone, setAllStepsDone] = useState(false)
  const [leads, setLeads] = useState([])
  const [openOutreach, setOpenOutreach] = useState([])
  const [toast, setToast] = useState('')
  const [keysLoading, setKeysLoading] = useState(true)
  const [keyOptions, setKeyOptions] = useState([])
  const [selectedKeyId, setSelectedKeyId] = useState(() => sessionStorage.getItem('crabstack_groq_key_id') || '')
  const [validatedKey, setValidatedKey] = useState('')
  const [validatedKeyId, setValidatedKeyId] = useState('')
  const [allLeads, setAllLeads] = useState([])
  const [allLeadsLoading, setAllLeadsLoading] = useState(true)
  const [allLeadsPage, setAllLeadsPage] = useState(1)
  const [leadRowUpdatingId, setLeadRowUpdatingId] = useState('')
  const [followUpDrafts, setFollowUpDrafts] = useState({})
  const [selectedLeadId, setSelectedLeadId] = useState('')
  const [leadModalOpen, setLeadModalOpen] = useState(false)
  const [autoSettings, setAutoSettings] = useState({
    enabled: false,
    weekly_target: 15,
    location: 'Mumbai, India',
    industry: 'general business',
    product: 'our services',
    lead_types: ['startup', 'local', 'individual'],
  })
  const [autoLoading, setAutoLoading] = useState(true)
  const [autoRunning, setAutoRunning] = useState(false)

  useEffect(() => {
    loadKeys()
    loadAllLeads()
    loadAutoSettings()
  }, [])

  useEffect(() => {
    if (!selectedKeyId) return
    sessionStorage.setItem('crabstack_groq_key_id', selectedKeyId)
  }, [selectedKeyId])

  useEffect(() => {
    if (!validatedKeyId) return
    if (validatedKeyId !== selectedKeyId) {
      setValidatedKey('')
      setValidatedKeyId('')
    }
  }, [selectedKeyId, validatedKeyId])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const loadKeys = async () => {
    setKeysLoading(true)
    try {
      const data = await api.get('/groq-keys')
      const list = Array.isArray(data) ? data : []
      setKeyOptions(list)

      if (list.length === 0) {
        setSelectedKeyId('')
      } else {
        const hasCurrent = list.some(item => item.id === selectedKeyId)
        if (!hasCurrent) setSelectedKeyId(list[0].id)
      }
    } catch (e) {
      log(`Failed to load Groq keys: ${e.message}`, 'err')
      setKeyOptions([])
      setSelectedKeyId('')
    } finally {
      setKeysLoading(false)
    }
  }

  const loadAllLeads = async () => {
    setAllLeadsLoading(true)
    try {
      const data = await api.get('/leads?include_deleted=false&limit=1000')
      const list = Array.isArray(data) ? data : []
      setAllLeads(list)
      setSelectedLeadId(prev => (list.some((lead) => lead.id === prev) ? prev : (list[0]?.id || '')))
      const drafts = {}
      list.forEach((lead) => {
        drafts[lead.id] = lead.follow_up_date ? String(lead.follow_up_date).slice(0, 10) : ''
      })
      setFollowUpDrafts(drafts)
    } catch (e) {
      log(`Failed to load leads list: ${e.message}`, 'err')
      setAllLeads([])
    } finally {
      setAllLeadsLoading(false)
    }
  }

  const loadAutoSettings = async () => {
    setAutoLoading(true)
    try {
      const data = await api.get('/leads/automation')
      setAutoSettings(prev => ({ ...prev, ...(data || {}) }))
    } catch (e) {
      log(`Failed to load auto leads settings: ${e.message}`, 'err')
    } finally {
      setAutoLoading(false)
    }
  }

  const stats = useMemo(() => {
    const hot = leads.filter(l => l.priority === 'hot').length
    const warm = leads.filter(l => l.priority === 'warm').length
    const avg = leads.length ? Math.round(leads.reduce((sum, l) => sum + (Number(l.fit_score) || 0), 0) / leads.length) : 0
    return { hot, warm, avg }
  }, [leads])

  const sortedAllLeads = useMemo(() => {
    return [...allLeads].sort((a, b) => {
      const pA = priorityOrder[String(a.priority || '').toLowerCase()] || 0
      const pB = priorityOrder[String(b.priority || '').toLowerCase()] || 0
      if (pB !== pA) return pB - pA

      const fitA = Number(a.fit_score) || 0
      const fitB = Number(b.fit_score) || 0
      if (fitB !== fitA) return fitB - fitA

      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })
  }, [allLeads])

  const selectedLead = useMemo(
    () => sortedAllLeads.find((lead) => lead.id === selectedLeadId) || null,
    [sortedAllLeads, selectedLeadId],
  )
  const totalAllLeadsPages = useMemo(
    () => Math.max(1, Math.ceil(sortedAllLeads.length / ALL_LEADS_PAGE_SIZE)),
    [sortedAllLeads.length],
  )
  const paginatedAllLeads = useMemo(() => {
    const start = (allLeadsPage - 1) * ALL_LEADS_PAGE_SIZE
    return sortedAllLeads.slice(start, start + ALL_LEADS_PAGE_SIZE)
  }, [allLeadsPage, sortedAllLeads])
  const allLeadsRangeStart = sortedAllLeads.length ? ((allLeadsPage - 1) * ALL_LEADS_PAGE_SIZE) + 1 : 0
  const allLeadsRangeEnd = Math.min(allLeadsPage * ALL_LEADS_PAGE_SIZE, sortedAllLeads.length)
  const selectedLeadWhatsappHref = useMemo(() => {
    const phoneDigits = String(selectedLead?.phone || '').replace(/\D+/g, '')
    return phoneDigits ? `https://wa.me/${phoneDigits}` : ''
  }, [selectedLead])

  useEffect(() => {
    if (allLeadsPage > totalAllLeadsPages) {
      setAllLeadsPage(totalAllLeadsPages)
    }
  }, [allLeadsPage, totalAllLeadsPages])

  const log = (text, type = '') => setLogs(prev => [...prev, { text, type }])

  const resetProgress = () => {
    setStepIndex(1)
    setAllStepsDone(false)
    setLogs([])
  }

  const toggleType = (id) => {
    setSelectedTypes(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev
        return prev.filter(t => t !== id)
      }
      return [...prev, id]
    })
  }

  const getSelectedKey = async () => {
    if (!selectedKeyId) throw new Error('Select a saved Groq key first')

    // Backward compatibility: if a raw key was stored in session, use it directly.
    if (selectedKeyId.includes('gsk_')) {
      const direct = normalizeGroqKey(selectedKeyId)
      if (!direct) throw new Error('Saved key value is invalid')
      return direct
    }

    const raw = await api.get(`/groq-keys/${selectedKeyId}/raw`)
    const apiKey = normalizeGroqKey(raw?.api_key)
    if (!apiKey) throw new Error('Selected key has no valid API value')
    return apiKey
  }

  const callGroq = async (apiKey, prompt, systemPrompt = 'You are a helpful business intelligence assistant. Always respond with valid JSON only.', maxTokens = 1200, retries = 3) => {
    for (let attempt = 0; attempt < retries; attempt++) {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: maxTokens,
          temperature: 0.7,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
        }),
      })

      if (res.status === 429) {
        const err = await res.json().catch(() => ({}))
        const msg = err?.error?.message || ''
        const waitMatch = msg.match(/try again in ([\d.]+)s/i)
        const waitSec = waitMatch ? Math.ceil(Number(waitMatch[1])) + 2 : 20
        log(`Rate limit hit - waiting ${waitSec}s before retry (${attempt + 1}/${retries})...`)
        await sleep(waitSec * 1000)
        continue
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message || `Groq API error ${res.status}`)
      }

      const data = await res.json()
      return data?.choices?.[0]?.message?.content || '{}'
    }
    throw new Error('Rate limit persisted after retries')
  }

  const testKey = async () => {
    if (!selectedKeyId) {
      log('Select a Groq key first', 'err')
      return
    }
    log('Testing selected Groq key...')
    try {
      const apiKey = await getSelectedKey()
      console.log('Leads Test Key:', apiKey)
      await callGroq(apiKey, 'Reply with {"status":"ok"}', undefined, 80, 2)
      setValidatedKey(apiKey)
      setValidatedKeyId(selectedKeyId)
      log('Groq key is valid', 'ok')
      setToast('Key valid')
    } catch (e) {
      log(`Error: ${e.message}`, 'err')
    }
  }

  const clearResults = () => {
    setLeads([])
    setOpenOutreach([])
    resetProgress()
    setLogs([{ text: 'Cleared - ready for new lead run', type: '' }])
  }

  const toggleOutreach = (index) => {
    setOpenOutreach(prev => (prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]))
  }

  const copyText = async (text, successText) => {
    try {
      await navigator.clipboard.writeText(text)
      setToast(successText)
    } catch {
      setToast('Clipboard failed')
    }
  }

  const copyLead = (lead) => {
    const text = [
      `Name: ${lead.name || ''}`,
      `Type: ${lead.type || ''}`,
      `Industry: ${lead.industry || ''}`,
      `Location: ${lead.location || ''}`,
      `Email: ${lead.email || ''}`,
      `Phone: ${lead.phone || ''}`,
      `Website: ${lead.website || ''}`,
      `LinkedIn: ${lead.linkedin || ''}`,
      `Size: ${lead.size || ''}`,
      `Revenue: ${lead.revenue_estimate || ''}`,
      `Decision Maker: ${lead.decision_maker || ''}`,
      `Fit Score: ${lead.fit_score || ''}`,
      `Intent Score: ${lead.intent_score || ''}`,
      `Reach Score: ${lead.reach_score || ''}`,
      `Priority: ${lead.priority || ''}`,
      `Reason: ${lead.reason || ''}`,
      lead.outreach_body ? `\n--- Outreach ---\nSubject: ${lead.outreach_subject || ''}\n\n${lead.outreach_body}` : '',
    ].filter(Boolean).join('\n')
    copyText(text, 'Lead copied')
  }

  const copyEmail = (lead) => {
    if (!lead.outreach_body) {
      setToast('No outreach generated')
      return
    }
    copyText(`Subject: ${lead.outreach_subject || ''}\n\n${lead.outreach_body}`, 'Email copied')
  }

  const download = (filename, content, mimeType) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    if (!leads.length) {
      setToast('No leads to export')
      return
    }
    const cols = ['name', 'type', 'industry', 'location', 'email', 'phone', 'website', 'linkedin', 'size', 'founded', 'revenue_estimate', 'decision_maker', 'social_presence', 'tech_stack', 'pain_points', 'fit_score', 'intent_score', 'reach_score', 'priority', 'reason', 'outreach_subject', 'outreach_body']
    const csv = [
      cols.join(','),
      ...leads.map(lead => cols.map(col => {
        let v = lead[col]
        if (Array.isArray(v)) v = v.join('; ')
        v = (v || '').toString().replace(/"/g, '""').replace(/\n/g, ' ')
        return `"${v}"`
      }).join(',')),
    ].join('\n')
    download('leads.csv', csv, 'text/csv;charset=utf-8')
    setToast('CSV exported')
  }

  const exportJSON = () => {
    if (!leads.length) {
      setToast('No leads to export')
      return
    }
    download('leads.json', JSON.stringify(leads, null, 2), 'application/json;charset=utf-8')
    setToast('JSON exported')
  }

  const saveLeadsToDatabase = async (rows, context) => {
    if (!Array.isArray(rows) || rows.length === 0) return { saved: 0 }
    return api.post('/leads/bulk', { leads: rows, context })
  }

  const toggleAutoLeads = async () => {
    if (autoLoading) return
    const nextEnabled = !autoSettings.enabled
    setAutoLoading(true)
    try {
      const payload = {
        enabled: nextEnabled,
        weekly_target: Math.max(15, Number(autoSettings.weekly_target) || 15),
        location: location.trim() || 'Mumbai, India',
        industry: industry.trim() || 'general business',
        product: product.trim() || 'our services',
        lead_types: selectedTypes,
        key_id: selectedKeyId || null,
      }
      const updated = await api.put('/leads/automation', payload)
      setAutoSettings(prev => ({ ...prev, ...(updated || {}), enabled: nextEnabled }))
      setToast(nextEnabled ? 'Auto leads enabled' : 'Auto leads disabled')
      log(nextEnabled ? 'Auto leads enabled (min 15/week)' : 'Auto leads disabled', 'ok')
    } catch (e) {
      log(`Failed to update auto leads: ${e.message}`, 'err')
    } finally {
      setAutoLoading(false)
    }
  }

  const runAutoLeadsNow = async () => {
    setAutoRunning(true)
    try {
      const out = await api.post('/leads/automation/run', {})
      if (out?.skipped) {
        log(`Auto leads skipped: ${out.reason}`, 'err')
      } else {
        log(`Auto leads saved ${out.saved || 0} leads`, 'ok')
      }
      await loadAllLeads()
      setToast('Auto run complete')
    } catch (e) {
      log(`Auto leads run failed: ${e.message}`, 'err')
    } finally {
      setAutoRunning(false)
    }
  }

  const markLeadFollowUp = async (leadId) => {
    setLeadRowUpdatingId(leadId)
    try {
      await api.patch(`/leads/${leadId}`, { status: 'follow_up' })
      await loadAllLeads()
      setToast('Lead marked follow up')
    } catch (e) {
      log(`Failed to update lead: ${e.message}`, 'err')
    } finally {
      setLeadRowUpdatingId('')
    }
  }

  const saveFollowUpDate = async (leadId) => {
    const followDate = followUpDrafts[leadId] || null
    setLeadRowUpdatingId(leadId)
    try {
      await api.patch(`/leads/${leadId}`, {
        status: 'follow_up',
        follow_up_date: followDate || null,
      })
      await loadAllLeads()
      setToast('Follow up date updated')
    } catch (e) {
      log(`Failed to save follow up date: ${e.message}`, 'err')
    } finally {
      setLeadRowUpdatingId('')
    }
  }

  const deleteLead = async (leadId) => {
    if (!confirm('Delete this lead?')) return
    setLeadRowUpdatingId(leadId)
    try {
      await api.delete(`/leads/${leadId}`)
      await loadAllLeads()
      setToast('Lead deleted')
    } catch (e) {
      log(`Failed to delete lead: ${e.message}`, 'err')
    } finally {
      setLeadRowUpdatingId('')
    }
  }

  const getWhatsAppLink = (phone) => {
    const digits = String(phone || '').replace(/\D/g, '')
    if (!digits) return ''
    return `https://wa.me/${digits}`
  }

  const generateLeads = async () => {
    if (!selectedKeyId) {
      log('Select a saved Groq key first', 'err')
      return
    }

    const loc = location.trim() || 'Mumbai, India'
    const niche = industry.trim() || 'general business'
    const offering = product.trim() || 'our services'
    const count = Number(numLeads)

    setLoading(true)
    setLeads([])
    setOpenOutreach([])
    resetProgress()

    try {
      const apiKey = validatedKey && validatedKeyId === selectedKeyId
        ? validatedKey
        : await getSelectedKey()
      setStepIndex(1)
      log(`Step 1/4 - Finding ${count} leads in ${loc} (${niche})...`)
      const p1 = `Generate ${count} realistic but fictional business leads in ${loc} in the ${niche} industry/niche.
Mix of types from: ${selectedTypes.join(', ')}.
Return a JSON array of exactly ${count} objects with keys:
- name (string)
- type (string): one of ${selectedTypes.map(t => `"${t}"`).join(', ')}
- industry (string)
- location (string)
- size (string)
- website (string): plausible domain like "example.com"
- linkedin (string): plausible LinkedIn URL
- email (string): plausible business email
- phone (string): plausible local phone with country code
- description (string): 1 sentence
Return ONLY valid JSON array.`

      const raw1 = await callGroq(apiKey, p1, undefined, 1200)
      const found = safeJSON(raw1)
      if (!Array.isArray(found)) throw new Error('Expected array')
      log(`Found ${found.length} leads`, 'ok')

      setStepIndex(2)
      log('Step 2/4 - Enriching lead data...')
      let enriched = found
      try {
        const p2 = `Given these leads: ${JSON.stringify(found)}
Enrich each lead and return same array with:
- founded (string)
- revenue_estimate (string)
- pain_points (array of 2 strings)
- tech_stack (array of 2-3 strings)
- decision_maker (string)
- social_presence (string): one of "low","medium","high"
Return ONLY valid JSON array.`

        const raw2 = await callGroq(apiKey, p2, undefined, 1200)
        const parsed = safeJSON(raw2)
        if (Array.isArray(parsed)) {
          enriched = parsed
          log(`Enriched ${parsed.length} leads`, 'ok')
        } else {
          throw new Error('Expected array')
        }
      } catch (e) {
        log(`Enrichment partial: ${e.message}`, 'err')
      }

      setStepIndex(3)
      log('Step 3/4 - Scoring and qualifying leads...')
      const scored = []
      for (let i = 0; i < enriched.length; i++) {
        const lead = enriched[i]
        log(`Scoring ${i + 1}/${enriched.length}: ${lead.name || 'Lead'}...`)
        try {
          const p3 = `You are a sales expert. Score this lead for a company selling "${offering}".
Lead: ${JSON.stringify(lead)}
Return JSON object with:
- fit_score (integer 1-100)
- intent_score (integer 1-100)
- reach_score (integer 1-100)
- priority (string: "hot", "warm", "cold")
- reason (string, max 15 words, no newline)
Return ONLY valid JSON.`
          const raw3 = await callGroq(apiKey, p3, undefined, 240)
          const scores = safeJSON(raw3)
          scored.push({ ...lead, ...scores })
          if (i < enriched.length - 1) await sleep(1500)
        } catch (e) {
          log(`Score failed for ${lead.name || 'lead'}: ${e.message}`, 'err')
          scored.push({ ...lead, fit_score: 70, intent_score: 60, reach_score: 65, priority: 'warm', reason: 'Could not score' })
        }
      }

      scored.sort((a, b) => (Number(b.fit_score) || 0) - (Number(a.fit_score) || 0))
      log(`Scored and ranked ${scored.length} leads`, 'ok')

      setStepIndex(4)
      log('Step 4/4 - Generating outreach...')
      let outreachOk = 0
      for (let i = 0; i < scored.length; i++) {
        const lead = scored[i]
        log(`Writing outreach ${i + 1}/${scored.length}: ${lead.name || 'Lead'}...`)
        try {
          const p4 = `Write a cold outreach email for selling "${offering}" to this lead:
Name: ${lead.name || ''}
Type: ${lead.type || ''}
Industry: ${lead.industry || ''}
Description: ${lead.description || ''}
Pain points: ${Array.isArray(lead.pain_points) ? lead.pain_points.join(', ') : lead.pain_points || ''}
Decision maker title: ${lead.decision_maker || 'Founder'}
Location: ${lead.location || ''}

Return JSON object with:
- subject: one line
- body: 3 paragraphs as one string, split by \\n\\n
Return ONLY valid JSON.`
          const raw4 = await callGroq(apiKey, p4, undefined, 600)
          const outreach = safeJSON(raw4)
          lead.outreach_subject = outreach.subject
          lead.outreach_body = outreach.body
          outreachOk++
          if (i < scored.length - 1) await sleep(2000)
        } catch (e) {
          log(`Skipped outreach for ${lead.name || 'lead'}: ${e.message}`, 'err')
        }
      }
      if (outreachOk > 0) log(`Outreach generated for ${outreachOk}/${scored.length} leads`, 'ok')

      setLeads(scored)
      try {
        const saveResult = await saveLeadsToDatabase(scored, {
          location: loc,
          industry: niche,
          product: offering,
          selected_types: selectedTypes,
          requested_count: count,
        })
        const savedCount = Number(saveResult?.saved) || scored.length
        log(`Saved ${savedCount} leads to database`, 'ok')
        await loadAllLeads()
      } catch (e) {
        log(`Generated leads but failed to save in database: ${e.message}`, 'err')
      }
      setAllStepsDone(true)
      setToast('Lead generation complete')
    } catch (e) {
      log(`Error: ${e.message}`, 'err')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">track_changes</span>
            Leads
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Find, enrich, score and create outreach leads with Groq.</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5 text-xs text-zinc-400">Groq Cloud</div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
        <div className="text-zinc-300 font-semibold mb-3 text-sm">Groq API Key</div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedKeyId}
            onChange={e => setSelectedKeyId(e.target.value)}
            disabled={keysLoading || keyOptions.length === 0}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white"
          >
            {keyOptions.length === 0 ? (
              <option value="">{keysLoading ? 'Loading keys...' : 'No keys found'}</option>
            ) : (
              keyOptions.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.masked_key})
                </option>
              ))
            )}
          </select>
          <button onClick={testKey} disabled={!selectedKeyId || keysLoading} className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-semibold">
            Test Key
          </button>
        </div>

        <div className="text-zinc-500 text-xs mt-2 flex flex-wrap items-center gap-2">
          <span>Manage keys from settings.</span>
          <Link to="/admin/groq-keys" className="text-primary hover:underline">Open Groq Keys</Link>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <div className="text-zinc-300 font-semibold text-sm">Auto Leads</div>
            <div className="text-zinc-500 text-xs mt-1">Keeps your weekly leads count at least {Math.max(15, Number(autoSettings.weekly_target) || 15)}.</div>
          </div>
          <button
            onClick={toggleAutoLeads}
            disabled={autoLoading || !selectedKeyId}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${autoSettings.enabled ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-white'} disabled:opacity-50`}
          >
            {autoSettings.enabled ? 'Auto Leads ON' : 'Auto Leads OFF'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={runAutoLeadsNow}
            disabled={autoRunning}
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-xs font-semibold"
          >
            {autoRunning ? 'Running...' : 'Run Auto Now'}
          </button>
          <span className="text-zinc-500 text-xs self-center">Uses current location/industry/product and selected lead types.</span>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
        <div className="text-zinc-300 font-semibold mb-3 text-sm">Search Parameters</div>
        <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Lead Types</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {typeOptions.map(type => {
            const active = selectedTypes.includes(type.id)
            return (
              <button
                key={type.id}
                onClick={() => toggleType(type.id)}
                className={`px-3 py-1.5 rounded-full border text-sm flex items-center gap-1.5 transition ${
                  active
                    ? 'border-primary bg-primary/20 text-white'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-base">{type.icon}</span>
                {type.label}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-zinc-400 text-sm block mb-1">Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Mumbai, India" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white" />
          </div>
          <div>
            <label className="text-zinc-400 text-sm block mb-1">Industry / Niche</label>
            <input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. SaaS, restaurants, freelancers" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white" />
          </div>
          <div>
            <label className="text-zinc-400 text-sm block mb-1">Your Product / Service</label>
            <input value={product} onChange={e => setProduct(e.target.value)} placeholder="e.g. CRM software, web design agency" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white" />
          </div>
          <div>
            <label className="text-zinc-400 text-sm block mb-1">Number of Leads</label>
            <select value={numLeads} onChange={e => setNumLeads(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white">
              <option value="3">3 leads - quick test</option>
              <option value="5">5 leads</option>
              <option value="8">8 leads</option>
              <option value="10">10 leads</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={generateLeads}
            disabled={loading || !selectedKeyId}
            className="bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2"
          >
            {loading ? <span className="inline-block size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-base">auto_awesome</span>}
            {loading ? 'Generating...' : 'Generate Leads'}
          </button>
          <button onClick={clearResults} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold">Clear Results</button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          {stepLabels.map((label, idx) => {
            const n = idx + 1
            const done = allStepsDone || n < stepIndex
            const active = !allStepsDone && n === stepIndex
            return (
              <div key={label} className={`rounded-lg border px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 ${
                done
                  ? 'border-emerald-700/50 text-emerald-400 bg-emerald-500/10'
                  : active
                    ? 'border-primary text-white bg-primary/15'
                    : 'border-zinc-800 text-zinc-500 bg-zinc-950'
              }`}>
                <span className="material-symbols-outlined text-sm">{done ? 'check' : active ? 'hourglass_top' : 'radio_button_unchecked'}</span>
                {n}. {label}
              </div>
            )
          })}
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 h-28 overflow-y-auto font-mono text-xs space-y-1">
          {logs.map((item, i) => (
            <div
              key={`${item.text}-${i}`}
              className={`${item.type === 'ok' ? 'text-emerald-400' : item.type === 'err' ? 'text-red-400' : 'text-zinc-500'}`}
            >
              &gt; {item.text}
            </div>
          ))}
        </div>
      </div>

      {leads.length > 0 ? (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{leads.length}</div>
              <div className="text-xs text-zinc-500 mt-1">Total Leads</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{stats.hot}</div>
              <div className="text-xs text-zinc-500 mt-1">Hot Leads</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{stats.warm}</div>
              <div className="text-xs text-zinc-500 mt-1">Warm Leads</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{stats.avg}</div>
              <div className="text-xs text-zinc-500 mt-1">Avg Fit Score</div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <h2 className="text-lg font-bold">{leads.length} Leads - Ranked by Fit</h2>
            <div className="flex gap-2">
              <button onClick={exportCSV} className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-sm font-semibold">Export CSV</button>
              <button onClick={exportJSON} className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-sm font-semibold">Export JSON</button>
            </div>
          </div>

          <div className="space-y-3">
            {leads.map((lead, index) => {
              const priorityClass = lead.priority === 'hot' ? 'text-red-400' : lead.priority === 'warm' ? 'text-amber-400' : 'text-zinc-500'
              return (
                <div key={`${lead.name || 'lead'}-${index}`} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="text-lg font-bold flex items-center gap-2 flex-wrap">
                        <span className="truncate">{lead.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs border border-zinc-700 bg-zinc-800 text-zinc-300">{lead.type}</span>
                      </div>
                      <div className="text-sm text-zinc-500 mt-1">{lead.industry || ''} {lead.industry && lead.location ? '·' : ''} {lead.location || ''} {lead.founded ? `· Est. ${lead.founded}` : ''}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-3xl font-bold ${priorityClass}`}>{lead.fit_score || '?'}</div>
                      <div className="text-xs text-zinc-500">fit score</div>
                      <div className={`text-xs font-semibold uppercase mt-1 ${priorityClass}`}>{lead.priority || 'unknown'}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400 mb-3">
                    {lead.email && <span>{lead.email}</span>}
                    {lead.phone && <span>{lead.phone}</span>}
                    {lead.website && (
                      <a href={`https://${lead.website}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        {lead.website}
                      </a>
                    )}
                    {lead.linkedin && (
                      <a href={lead.linkedin} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        LinkedIn
                      </a>
                    )}
                  </div>

                  {lead.description && <p className="text-sm text-zinc-400 mb-3">{lead.description}</p>}
                  {lead.pain_points && (
                    <p className="text-sm text-zinc-500 mb-3">
                      <span className="text-zinc-300 font-semibold">Pain points:</span>{' '}
                      {Array.isArray(lead.pain_points) ? lead.pain_points.join(' • ') : lead.pain_points}
                    </p>
                  )}

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 w-12">Fit</span>
                      <div className="flex-1 h-1.5 rounded bg-zinc-800 overflow-hidden"><div className="h-full bg-zinc-200" style={{ width: `${lead.fit_score || 0}%` }} /></div>
                      <span className="text-xs text-zinc-400 w-8 text-right">{lead.fit_score || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 w-12">Intent</span>
                      <div className="flex-1 h-1.5 rounded bg-zinc-800 overflow-hidden"><div className="h-full bg-blue-400" style={{ width: `${lead.intent_score || 0}%` }} /></div>
                      <span className="text-xs text-zinc-400 w-8 text-right">{lead.intent_score || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 w-12">Reach</span>
                      <div className="flex-1 h-1.5 rounded bg-zinc-800 overflow-hidden"><div className="h-full bg-emerald-400" style={{ width: `${lead.reach_score || 0}%` }} /></div>
                      <span className="text-xs text-zinc-400 w-8 text-right">{lead.reach_score || 0}</span>
                    </div>
                  </div>

                  {lead.reason && <div className="text-xs text-zinc-500 italic mb-3">{lead.reason}</div>}

                  <div className="pt-3 border-t border-zinc-800 flex gap-2 flex-wrap">
                    {lead.outreach_body && (
                      <button onClick={() => toggleOutreach(index)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-sm font-semibold">
                        {openOutreach.includes(index) ? 'Hide Outreach' : 'View Outreach'}
                      </button>
                    )}
                    <button onClick={() => copyLead(lead)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-sm font-semibold">Copy Lead</button>
                    <button onClick={() => copyEmail(lead)} className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-sm font-semibold">Copy Email</button>
                  </div>

                  {lead.outreach_body && openOutreach.includes(index) && (
                    <div className="mt-3 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-300 whitespace-pre-wrap">
                      <div className="font-semibold mb-2 text-zinc-100">Subject: {lead.outreach_subject || 'Introduction'}</div>
                      {lead.outreach_body}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={`lead-skeleton-${i}`} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="space-y-2">
                  <div className="h-5 w-44 bg-zinc-800 rounded" />
                  <div className="h-4 w-60 bg-zinc-800 rounded" />
                </div>
                <div className="h-8 w-12 bg-zinc-800 rounded" />
              </div>
              <div className="h-4 w-full bg-zinc-800 rounded mb-2" />
              <div className="h-4 w-10/12 bg-zinc-800 rounded mb-4" />
              <div className="h-2 w-full bg-zinc-800 rounded mb-2" />
              <div className="h-2 w-9/12 bg-zinc-800 rounded mb-4" />
              <div className="flex gap-2">
                <div className="h-8 w-24 bg-zinc-800 rounded" />
                <div className="h-8 w-24 bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-zinc-500">
          Leads will appear here
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mt-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-bold">All Leads Panel</h2>
          <button onClick={loadAllLeads} className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-xs font-semibold">Refresh</button>
        </div>

        {allLeadsLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Priority</th>
                  <th className="text-left p-2">Fit Score</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Contact</th>
                  <th className="text-left p-2">Follow Up Date</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4, 5].map((row) => (
                  <tr key={`all-leads-skeleton-${row}`} className="border-b border-zinc-800/60">
                    <td className="p-2"><div className="h-4 w-44 bg-zinc-800 rounded animate-pulse" /></td>
                    <td className="p-2"><div className="h-6 w-16 bg-zinc-800 rounded animate-pulse" /></td>
                    <td className="p-2"><div className="h-4 w-10 bg-zinc-800 rounded animate-pulse" /></td>
                    <td className="p-2"><div className="h-6 w-14 bg-zinc-800 rounded animate-pulse" /></td>
                    <td className="p-2"><div className="h-6 w-20 bg-zinc-800 rounded animate-pulse" /></td>
                    <td className="p-2"><div className="h-7 w-28 bg-zinc-800 rounded animate-pulse" /></td>
                    <td className="p-2"><div className="h-7 w-36 bg-zinc-800 rounded animate-pulse" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : allLeads.length === 0 ? (
          <div className="text-zinc-500 text-sm py-6 text-center">No saved leads yet.</div>
        ) : (
          <div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Priority</th>
                  <th className="text-left p-2">Fit Score</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Contact</th>
                  <th className="text-left p-2">Follow Up Date</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAllLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`border-b border-zinc-800/60 align-top cursor-pointer hover:bg-zinc-800/30 ${selectedLeadId === lead.id ? 'bg-zinc-800/30' : ''}`}
                    onClick={() => {
                      setSelectedLeadId(lead.id)
                      setLeadModalOpen(true)
                    }}
                  >
                    <td className="p-2">
                      <div className="font-semibold text-white underline decoration-zinc-700">{lead.name || '-'}</div>
                      <div className="text-xs text-zinc-500">{lead.industry || '-'} {lead.location ? `· ${lead.location}` : ''}</div>
                    </td>
                    <td className="p-2">
                      <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-300 uppercase">{lead.priority || '-'}</span>
                    </td>
                    <td className="p-2 text-zinc-300 font-semibold">{lead.fit_score ?? '-'}</td>
                    <td className="p-2">
                      <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-300 uppercase">{lead.status || 'new'}</span>
                    </td>
                    <td className="p-2">
                      <span className={`text-xs px-2 py-1 rounded uppercase ${lead.contact_status === 'verified' ? 'bg-emerald-600/20 text-emerald-300' : 'bg-zinc-800 text-zinc-300'}`}>
                        {lead.contact_status || 'unverified'}
                      </span>
                    </td>
                    <td className="p-2">
                      <input
                        type="date"
                        value={followUpDrafts[lead.id] || ''}
                        onClick={e => e.stopPropagation()}
                        onChange={e => setFollowUpDrafts(prev => ({ ...prev, [lead.id]: e.target.value }))}
                        className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white"
                      />
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            markLeadFollowUp(lead.id)
                          }}
                          type="button"
                          disabled={leadRowUpdatingId === lead.id}
                          className="bg-blue-600/80 hover:bg-blue-600 disabled:opacity-50 text-white px-2 py-1 rounded text-xs"
                        >
                          Follow Up
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            saveFollowUpDate(lead.id)
                          }}
                          type="button"
                          disabled={leadRowUpdatingId === lead.id}
                          className="bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-50 text-white px-2 py-1 rounded text-xs"
                        >
                          Save Date
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteLead(lead.id)
                          }}
                          type="button"
                          disabled={leadRowUpdatingId === lead.id}
                          className="bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white px-2 py-1 rounded text-xs"
                        >
                          Delete Lead
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="flex items-center justify-between gap-3 mt-3">
              <div className="text-xs text-zinc-500">
                Showing {allLeadsRangeStart}-{allLeadsRangeEnd} of {sortedAllLeads.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAllLeadsPage((prev) => Math.max(1, prev - 1))}
                  disabled={allLeadsPage <= 1}
                  className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs font-semibold"
                >
                  Previous
                </button>
                <span className="text-xs text-zinc-400">Page {allLeadsPage} / {totalAllLeadsPages}</span>
                <button
                  type="button"
                  onClick={() => setAllLeadsPage((prev) => Math.min(totalAllLeadsPages, prev + 1))}
                  disabled={allLeadsPage >= totalAllLeadsPages}
                  className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedLead && leadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setLeadModalOpen(false)}>
          <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold">{selectedLead.name || 'Lead Details'}</h3>
                <p className="text-zinc-500 text-xs mt-1">Lead ID: {selectedLead.id}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => markLeadFollowUp(selectedLead.id)}
                  disabled={leadRowUpdatingId === selectedLead.id}
                  className="bg-blue-600/80 hover:bg-blue-600 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                >
                  Follow Up
                </button>
                <button
                  onClick={() => saveFollowUpDate(selectedLead.id)}
                  disabled={leadRowUpdatingId === selectedLead.id}
                  className="bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                >
                  Save Follow Up Date
                </button>
                <button
                  onClick={() => deleteLead(selectedLead.id)}
                  disabled={leadRowUpdatingId === selectedLead.id}
                  className="bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                >
                  Delete Lead
                </button>
                <button
                  onClick={() => setLeadModalOpen(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="text-lg font-bold flex items-center gap-2 flex-wrap">
                    <span className="truncate">{selectedLead.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs border border-zinc-700 bg-zinc-800 text-zinc-300">{selectedLead.type || '-'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${selectedLead.contact_status === 'verified' ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'}`}>
                      {selectedLead.contact_status || 'unverified'}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-500 mt-1">{selectedLead.industry || '-'} {selectedLead.founded ? `· Est. ${selectedLead.founded}` : ''}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-3xl font-bold ${selectedLead.priority === 'hot' ? 'text-red-400' : selectedLead.priority === 'warm' ? 'text-amber-400' : 'text-zinc-500'}`}>{selectedLead.fit_score || '?'}</div>
                  <div className="text-xs text-zinc-500">fit score</div>
                  <div className={`text-xs font-semibold uppercase mt-1 ${selectedLead.priority === 'hot' ? 'text-red-400' : selectedLead.priority === 'warm' ? 'text-amber-400' : 'text-zinc-500'}`}>{selectedLead.priority || 'unknown'}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400 mb-3">
                {selectedLead.email && (
                  <a href={`mailto:${selectedLead.email}`} className="text-primary hover:underline">
                    {selectedLead.email}
                  </a>
                )}
                {selectedLead.phone && <span>{selectedLead.phone}</span>}
                {selectedLeadWhatsappHref && (
                  <a href={selectedLeadWhatsappHref} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    WhatsApp
                  </a>
                )}
                {selectedLead.website && (
                  <a href={`https://${selectedLead.website}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {selectedLead.website}
                  </a>
                )}
                {selectedLead.linkedin && (
                  <a href={selectedLead.linkedin} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    LinkedIn
                  </a>
                )}
              </div>

              {selectedLead.description && <p className="text-sm text-zinc-400 mb-3">{selectedLead.description}</p>}
              {selectedLead.pain_points && (
                <p className="text-sm text-zinc-500 mb-3">
                  <span className="text-zinc-300 font-semibold">Pain points:</span>{' '}
                  {Array.isArray(selectedLead.pain_points) ? selectedLead.pain_points.join(' • ') : selectedLead.pain_points}
                </p>
              )}

              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 w-12">Fit</span>
                  <div className="flex-1 h-1.5 rounded bg-zinc-800 overflow-hidden"><div className="h-full bg-zinc-200" style={{ width: `${selectedLead.fit_score || 0}%` }} /></div>
                  <span className="text-xs text-zinc-400 w-8 text-right">{selectedLead.fit_score || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 w-12">Intent</span>
                  <div className="flex-1 h-1.5 rounded bg-zinc-800 overflow-hidden"><div className="h-full bg-blue-400" style={{ width: `${selectedLead.intent_score || 0}%` }} /></div>
                  <span className="text-xs text-zinc-400 w-8 text-right">{selectedLead.intent_score || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 w-12">Reach</span>
                  <div className="flex-1 h-1.5 rounded bg-zinc-800 overflow-hidden"><div className="h-full bg-emerald-400" style={{ width: `${selectedLead.reach_score || 0}%` }} /></div>
                  <span className="text-xs text-zinc-400 w-8 text-right">{selectedLead.reach_score || 0}</span>
                </div>
              </div>

              {selectedLead.reason && (
                <div className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 mb-3">
                  <span className="font-semibold">Reason:</span> {selectedLead.reason}
                </div>
              )}

              <div className="mb-4">
                <label className="text-zinc-400 text-xs block mb-1">Follow Up Date</label>
                <input
                  type="date"
                  value={followUpDrafts[selectedLead.id] || ''}
                  onChange={e => setFollowUpDrafts(prev => ({ ...prev, [selectedLead.id]: e.target.value }))}
                  className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white"
                />
              </div>

              {(selectedLead.outreach_subject || selectedLead.outreach_body) && (
                <div className="mt-3 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-300 whitespace-pre-wrap">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="font-semibold text-zinc-100">Subject: {selectedLead.outreach_subject || 'Introduction'}</div>
                    <button
                      onClick={() => copyEmail(selectedLead)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded text-xs font-semibold"
                    >
                      Copy Email
                    </button>
                  </div>
                  {selectedLead.outreach_body || '-'}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      <div className={`fixed right-6 bottom-6 bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg transition-opacity ${toast ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {toast}
      </div>
    </div>
  )
}
