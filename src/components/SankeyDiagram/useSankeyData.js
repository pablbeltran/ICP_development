import { useMemo } from 'react'
import { INDUSTRY_COLORS, NOT_INTERESTED_COLOR, getLinkColor, NOT_INTERESTED_LINK_COLOR } from './sankeyColors'

export function useSankeyData(reconciledData) {
  return useMemo(() => {
    if (!reconciledData || reconciledData.length === 0) return null

    const industries = Object.keys(INDUSTRY_COLORS).sort()
    const n = industries.length

    // Aggregate per industry
    const agg = {}
    industries.forEach(ind => {
      const rows = reconciledData.filter(r => r['Industry'] === ind)
      agg[ind] = {
        connects: rows.reduce((s, r) => s + (parseInt(r['Connects']) || 0), 0),
        conversations: rows.reduce((s, r) => s + (parseInt(r['Conversations']) || 0), 0),
        meetings: rows.reduce((s, r) => s + (parseInt(r['Meetings Set']) || 0), 0),
        applications: rows.filter(r =>
          r['Lifecycle Stage'] === 'SQL' || r['Lifecycle Stage'] === 'Opportunity'
        ).length,
        approved: rows.filter(r => r['Application Status'] === 'Approved').length,
        rejected: rows.filter(r => r['Application Status'] === 'Rejected').length,
      }
    })

    const totalConnects = industries.reduce((s, ind) => s + agg[ind].connects, 0)
    const totalConversations = industries.reduce((s, ind) => s + agg[ind].conversations, 0)

    // Build nodes
    const nodeLabels = []
    const nodeColors = []

    // Stage 0: Industry connect nodes (indices 0..n-1)
    industries.forEach(ind => {
      const d = agg[ind]
      nodeLabels.push(`${ind}\n${d.connects}`)
      nodeColors.push(INDUSTRY_COLORS[ind])
    })

    // Stage 1: Unified "Connects" node (index n)
    nodeLabels.push(`Connects\n${totalConnects}`)
    nodeColors.push('#94a3b8')

    // Stages 2-4: Conversations, Meetings, Apps (each has n industry nodes + 1 drop-off)
    const stageKeys = ['conversations', 'meetings', 'applications']
    const stageDisplayNames = ['Conversations', 'Meetings', 'Apps']
    const dropOffNames = ['Not Interested', 'Not Interested.', 'Not Interested..']

    stageKeys.forEach((key, si) => {
      industries.forEach(ind => {
        const val = agg[ind][key]
        nodeLabels.push(`${stageDisplayNames[si]} - ${ind}\n${val}`)
        nodeColors.push(INDUSTRY_COLORS[ind])
      })
      // Drop-off node
      nodeLabels.push(dropOffNames[si])
      nodeColors.push(NOT_INTERESTED_COLOR)
    })

    // Stage 5: Outcomes (3 nodes)
    nodeLabels.push('Approved')
    nodeColors.push('#4CAF50')
    nodeLabels.push('Rejected')
    nodeColors.push('#F44336')
    nodeLabels.push('Not Progressed')
    nodeColors.push(NOT_INTERESTED_COLOR)

    // Build links
    const sources = []
    const targets = []
    const values = []
    const linkColors = []

    // Index helpers
    // Stage 0: 0..n-1  (industry connects)
    // Stage 1: n       (unified connects)
    const unifiedIdx = n
    // Stage 2: n+1 .. n+1+n-1 = industry convos, n+1+n = drop-off
    // Stage 3: n+1+(n+1) .. etc
    // Stage k (k>=2): n + 1 + (k-2)*(n+1) .. n + 1 + (k-2)*(n+1) + n-1 = industry, +n = drop-off
    const stageStart = (k) => {
      if (k === 0) return 0
      if (k === 1) return n
      return n + 1 + (k - 2) * (n + 1)
    }
    const dropOffIdx = (k) => stageStart(k) + n // only valid for k >= 2

    function addLink(src, tgt, val, clr) {
      if (val > 0) {
        sources.push(src)
        targets.push(tgt)
        values.push(val)
        linkColors.push(clr)
      }
    }

    industries.forEach((ind, i) => {
      const d = agg[ind]
      const color = INDUSTRY_COLORS[ind]
      const linkClr = getLinkColor(color)

      // Industry connects -> Unified Connects
      addLink(stageStart(0) + i, unifiedIdx, d.connects, linkClr)

      // Unified Connects -> Industry Conversations
      addLink(unifiedIdx, stageStart(2) + i, d.conversations, linkClr)

      // Conversations -> Meetings
      addLink(stageStart(2) + i, stageStart(3) + i, d.meetings, linkClr)
      addLink(stageStart(2) + i, dropOffIdx(3), d.conversations - d.meetings, NOT_INTERESTED_LINK_COLOR)

      // Meetings -> Applications
      addLink(stageStart(3) + i, stageStart(4) + i, d.applications, linkClr)
      addLink(stageStart(3) + i, dropOffIdx(4), d.meetings - d.applications, NOT_INTERESTED_LINK_COLOR)

      // Applications -> Outcomes
      const approvedIdx = stageStart(4) + n + 1
      const rejectedIdx = approvedIdx + 1
      const notProgIdx = rejectedIdx + 1

      if (d.approved > 0) addLink(stageStart(4) + i, approvedIdx, d.approved, linkClr)
      if (d.rejected > 0) addLink(stageStart(4) + i, rejectedIdx, d.rejected, getLinkColor('#F44336'))
      const remaining = d.applications - d.approved - d.rejected
      if (remaining > 0) addLink(stageStart(4) + i, notProgIdx, remaining, NOT_INTERESTED_LINK_COLOR)
    })

    // Unified Connects -> Not Interested (conversation drop-off)
    const connectsDropOff = totalConnects - totalConversations
    addLink(unifiedIdx, dropOffIdx(2), connectsDropOff, NOT_INTERESTED_LINK_COLOR)

    return {
      node: {
        label: nodeLabels,
        color: nodeColors,
        pad: 50,
        thickness: 30,
        line: { color: '#334155', width: 1 },
      },
      link: {
        source: sources,
        target: targets,
        value: values,
        color: linkColors,
      },
    }
  }, [reconciledData])
}
