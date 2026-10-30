// Realistic sample data, created the first time the server runs.
// All e-mail addresses use example.com (reserved for documentation, never real people).
const ago = (days, hours = 0) => new Date(Date.now() - days * 864e5 - hours * 36e5).toISOString();

function make(o) {
  const statusHistory = [{ status: 'pending', note: 'Complaint received.', by: 'system', at: ago(o.days) }];
  for (const s of o.steps || []) statusHistory.push({ status: s.status, note: s.note, by: 'admin', at: ago(s.days) });
  const last = statusHistory[statusHistory.length - 1];
  return {
    id: o.id,
    complaintId: o.cid,
    title: o.title,
    description: o.description,
    category: o.category,
    location: { address: o.address, lat: o.lat ?? null, lng: o.lng ?? null },
    reporterEmail: o.email,
    photo: null, // relative path such as "uploads/abc.jpg" when a photo exists
    status: last.status,
    statusHistory,
    resolutionNote: ['resolved', 'rejected'].includes(last.status) ? last.note : '',
    resolutionPhoto: null,
    flaggedCount: 0,
    createdAt: statusHistory[0].at,
    updatedAt: last.at,
  };
}

export function buildSeedData() {
  const issues = [
    make({ id: 'iss_seed01', cid: 'CF-20261017-PTH01', category: 'pothole', days: 6, email: 'citizen1@example.com',
      title: 'Deep pothole near City Bus Stand',
      description: 'A large pothole about 40 cm wide has formed in the left lane. Two-wheelers swerve suddenly to avoid it, which is dangerous during rush hour.',
      address: 'Gandhi Road, near City Bus Stand', lat: 17.9689, lng: 79.5941,
      steps: [{ status: 'in_progress', days: 4, note: 'Inspected by the road maintenance team. Repair material ordered.' }] }),
    make({ id: 'iss_seed02', cid: 'CF-20261011-GRB02', category: 'garbage', days: 12, email: 'citizen2@example.com',
      title: 'Overflowing garbage bin at Market Lane',
      description: 'The community bin has not been emptied for several days. Waste is spilling onto the road and attracting stray animals.',
      address: 'Market Lane, opposite Green Park',
      steps: [{ status: 'in_progress', days: 11, note: 'Sanitation vehicle assigned.' }, { status: 'resolved', days: 9, note: 'Bin emptied and the area cleaned. Collection frequency increased to daily.' }] }),
    make({ id: 'iss_seed03', cid: 'CF-20261021-LGT03', category: 'streetlight', days: 2, email: 'citizen3@example.com',
      title: 'Three streetlights not working',
      description: 'Three consecutive streetlights have been off for a week. The stretch is completely dark after 7 PM and feels unsafe for pedestrians.',
      address: 'Lakshmi Nagar Colony, 2nd Cross' }),
    make({ id: 'iss_seed04', cid: 'CF-20261015-DRN04', category: 'drainage', days: 8, email: 'citizen4@example.com',
      title: 'Blocked drain causing waterlogging',
      description: 'The storm drain is blocked with plastic waste. Even light rain floods the road and enters nearby shops.',
      address: 'Station Road, near the railway underpass', lat: 17.9712, lng: 79.6003,
      steps: [{ status: 'in_progress', days: 5, note: 'Desilting crew scheduled for this week.' }] }),
    make({ id: 'iss_seed05', cid: 'CF-20261008-WTR05', category: 'water_leakage', days: 15, email: 'citizen5@example.com',
      title: 'Water pipe leaking on main road',
      description: 'Clean drinking water has been leaking from a joint in the main pipeline for days. A small stream runs along the road.',
      address: 'Hanuman Temple Road, near the water tank',
      steps: [{ status: 'in_progress', days: 14, note: 'Water department informed.' }, { status: 'resolved', days: 11, note: 'Pipe joint replaced and the road surface repaired.' }] }),
    make({ id: 'iss_seed06', cid: 'CF-20261013-OTH06', category: 'other', days: 10, email: 'citizen6@example.com',
      title: 'Complaint about a private property fence',
      description: 'A neighbour built a fence slightly beyond the boundary of their plot. Please check the measurements.',
      address: 'Ashok Nagar, Plot 14',
      steps: [{ status: 'rejected', days: 9, note: 'This is a private land dispute and outside municipal civic services. Please contact the revenue office.' }] }),
    make({ id: 'iss_seed07', cid: 'CF-20261022-PTH07', category: 'pothole', days: 1, email: 'citizen7@example.com',
      title: 'Road cave-in after pipeline work',
      description: 'The road surface has sunk where the trench was filled after pipeline work. Vehicles slow down sharply at this spot.',
      address: 'Ring Road, near Government Hospital gate' }),
    make({ id: 'iss_seed08', cid: 'CF-20261019-GRB08', category: 'garbage', days: 4, email: 'citizen8@example.com',
      title: 'Illegal garbage dumping behind school',
      description: 'People are dumping household and construction waste behind the primary school wall. The smell is affecting students.',
      address: 'Behind Municipal Primary School, Nehru Street' }),
  ];

  const announcements = [
    { id: 'ann_01', title: 'Monsoon drain cleaning drive', body: 'Desilting of major storm drains is under way. Report blocked drains in your street so crews can prioritise them.', at: ago(3) },
    { id: 'ann_02', title: 'Streetlight maintenance schedule', body: 'Night-time inspections are covering residential colonies this month. Include the nearest landmark when reporting a broken light.', at: ago(7) },
    { id: 'ann_03', title: 'Keep your complaint ID safe', body: 'You need both your complaint ID and e-mail address to track a report or mark it unresolved.', at: ago(14) },
  ];

  return { issues, announcements, activity: [] };
}
