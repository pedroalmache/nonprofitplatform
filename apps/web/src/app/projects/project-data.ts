export type ProjectStatus = 'in-progress' | 'completed' | 'planned';

export interface ProjectPhoto {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface ProjectUpdate {
  heading: string;
  /** Written on the source page for this update. Null leaves the date space empty. */
  date: string | null;
  paragraphs: readonly string[];
  photos: readonly ProjectPhoto[];
  link?: { href: string; label: string };
}

export interface ProjectSection {
  heading: string;
  paragraphs: readonly string[];
  items?: readonly string[];
}

export interface ProjectRecord {
  slug: string;
  title: string;
  place: string;
  status: ProjectStatus;
  summary: string;
  notes: readonly string[];
  photos: readonly ProjectPhoto[];
  /** Photograph shown on the Where We Stand card. */
  cardPhoto: ProjectPhoto;
  /** Shown beside the project story, outside the slideshow. */
  locationMap: ProjectPhoto;
  updates: readonly ProjectUpdate[];
  sections: readonly ProjectSection[];
  pageLinks?: readonly { href: string; label: string }[];
}

export const PROJECT_STATUS_ORDER: readonly ProjectStatus[] = [
  'in-progress',
  'planned',
  'completed',
];

const STATUS_LABELS: Record<ProjectStatus, string> = {
  'in-progress': 'Currently in progress',
  planned: 'Planned',
  completed: 'Completed',
};

export function statusLabel(status: ProjectStatus): string {
  return STATUS_LABELS[status];
}

function photo(src: string, alt: string, width: number, height: number): ProjectPhoto {
  return { src, alt, width, height };
}

const erangauTrenchCaption =
  'An EWB-SBV engineer inspecting the trench with an Erangau leader and translator before laying water pipe.';
const erangauPressureCaption =
  'A Longido Water District engineer and an EWB-SBV engineer inspecting the pressure reducing tank with the Erangau water board chairman during construction.';
const erangauTankCaption = 'Main storage tank during construction and after completion.';
const erangauTapBuildCaption =
  'EWB-SBV engineers inspecting the new tap stand construction.';
const erangauTapUseCaption = 'Erangau community members gathering water at the new tap stand.';

const erangauMap = photo(
  'images/projects/tanzania-erangau/erangau-vicinity-map.webp',
  'Vicinity map from the Tanzania Erangau project page.',
  911,
  870,
);
const erangauRoadTrench = photo(
  'images/projects/tanzania-erangau/erangau-roadside-trench.webp',
  'Open trench and pipe along a road in the Erangau community.',
  1600,
  900,
);
const erangauTrenchInspection = photo(
  'images/projects/tanzania-erangau/erangau-trench-inspection.webp',
  erangauTrenchCaption,
  1280,
  960,
);
const erangauPressureTank = photo(
  'images/projects/tanzania-erangau/erangau-pressure-reducing-tank.webp',
  erangauPressureCaption,
  1600,
  1200,
);
const erangauMainTank = photo(
  'images/projects/tanzania-erangau/erangau-main-storage-tank.webp',
  erangauTankCaption,
  1600,
  1200,
);
const erangauTapMasonry = photo(
  'images/projects/tanzania-erangau/erangau-tap-stand-masonry.webp',
  erangauTapBuildCaption,
  1600,
  1200,
);
const erangauTankPlumbing = photo(
  'images/projects/tanzania-erangau/erangau-tank-plumbing.webp',
  'Concrete tank and exposed pipes at the Erangau water project.',
  1600,
  1200,
);
const erangauTrenchCrew = photo(
  'images/projects/tanzania-erangau/erangau-trench-crew.webp',
  erangauTrenchCaption,
  1200,
  1600,
);
const erangauPressurePiping = photo(
  'images/projects/tanzania-erangau/erangau-pressure-tank-piping.webp',
  erangauPressureCaption,
  1600,
  1066,
);
const erangauValve = photo(
  'images/projects/tanzania-erangau/erangau-valve-assembly.webp',
  erangauPressureCaption,
  1600,
  1066,
);
const erangauTankMasonry = photo(
  'images/projects/tanzania-erangau/erangau-tank-masonry.webp',
  erangauTankCaption,
  1600,
  1200,
);
const erangauTankInterior = photo(
  'images/projects/tanzania-erangau/erangau-tank-interior.webp',
  erangauTankCaption,
  1080,
  1080,
);
const erangauBlueTank = photo(
  'images/projects/tanzania-erangau/erangau-blue-tank.webp',
  'Blue storage tank shown with the Erangau main storage tank photographs.',
  1000,
  450,
);
const erangauRedTank = photo(
  'images/projects/tanzania-erangau/erangau-red-tank.webp',
  'Red storage tank shown with the Erangau main storage tank photographs.',
  810,
  1080,
);
const erangauTapBuilders = photo(
  'images/projects/tanzania-erangau/erangau-tap-stand-builders.webp',
  erangauTapBuildCaption,
  1600,
  1066,
);
const erangauTapGroup = photo(
  'images/projects/tanzania-erangau/erangau-tap-stand-group.webp',
  erangauTapBuildCaption,
  1600,
  1066,
);
const erangauTapUse = photo(
  'images/projects/tanzania-erangau/erangau-tap-stand-in-use.webp',
  erangauTapUseCaption,
  609,
  946,
);
const erangauTapUse2 = photo(
  'images/projects/tanzania-erangau/erangau-tap-stand-in-use-2.webp',
  erangauTapUseCaption,
  608,
  860,
);
const erangauPhaseMap = photo(
  'images/projects/tanzania-erangau/erangau-phase-map.webp',
  'Phase 1 and Phase 2 map from the Erangau project page.',
  1600,
  878,
);

const chixoyMap = photo(
  'images/projects/guatemala-chixoy/chixoy-guatemala-map.webp',
  'Map of Guatemala from the Río Chixoy project page.',
  876,
  696,
);
const chixoyHillside = photo(
  'images/projects/guatemala-chixoy/chixoy-hillside-gathering.webp',
  'People gathered on a grassy hillside, from the Río Chixoy project page.',
  617,
  676,
);
const chixoyRiver = photo(
  'images/projects/guatemala-chixoy/chixoy-river-landscape.webp',
  'River and green hills, from the Río Chixoy project page.',
  841,
  541,
);
const chixoyBanner = photo(
  'images/projects/guatemala-chixoy/chixoy-group-with-banner.webp',
  'Group of people standing outdoors with a banner, from the Río Chixoy project page.',
  1259,
  714,
);

const olmotiMap = photo(
  'images/projects/tanzania-olmoti/olmoti-vicinity-map.webp',
  'Vicinity map from the Tanzania Olmoti project page.',
  911,
  870,
);
const olmotiPortrait = photo(
  'images/projects/tanzania-olmoti/olmoti-community-portrait.webp',
  'Portrait from the Tanzania Olmoti project page.',
  1280,
  1280,
);
const olmotiTap = photo(
  'images/projects/tanzania-olmoti/olmoti-tap-container.webp',
  'Person filling a container at an outdoor tap, from the Tanzania Olmoti project page.',
  480,
  640,
);
const olmotiCommunityTap = photo(
  'images/projects/tanzania-olmoti/olmoti-community-at-tap.webp',
  'People gathered at an outdoor water tap, from the Tanzania Olmoti project page.',
  1600,
  1200,
);
const olmotiPipeline = photo(
  'images/projects/tanzania-olmoti/olmoti-pipeline-construction.webp',
  'Pipeline construction from the Tanzania Olmoti project page.',
  1600,
  1200,
);
const olmotiTank = photo(
  'images/projects/tanzania-olmoti/olmoti-storage-tank.webp',
  'Storage tank at the Olmoti water project.',
  1600,
  1066,
);

const muyuyo = (file: string, alt: string, width: number, height: number): ProjectPhoto =>
  photo(`images/projects/ecuador-el-muyuyo/${file}`, alt, width, height);

const muyuyoCommunityGathering = muyuyo(
  'el-muyuyo-community-gathering.webp',
  'Outdoor community gathering, from the El Muyuyo project page.',
  1600,
  1066,
);
const muyuyoMap = muyuyo(
  'el-muyuyo-ecuador-map.webp',
  'Map of Ecuador from the El Muyuyo project page.',
  637,
  683,
);
const muyuyoWaterContainers = muyuyo(
  'el-muyuyo-water-containers.webp',
  'Water containers outdoors, from the El Muyuyo project page.',
  1600,
  1200,
);

export const PROJECTS: readonly ProjectRecord[] = [
  {
    slug: 'guatemala-rio-chixoy',
    title: 'Guatemala - Río Chixoy',
    place: 'Rio Chixoy, San Cristobal Verapaz, Alta Verapaz, Guatemala',
    status: 'in-progress',
    summary:
      'Water supply project for Rio Chixoy in the Municipality of San Cristobal Verapaz, adopted by the chapter in 2025.',
    notes: [
      'The project-page heading uses “Río Chixoy.” Much of the body text spells it “Rio Chixoy.” Both are kept as written.',
      'The community-background text says “In 2025, EWB-SVB adopted the project.” That spelling is kept as published. It reads as a typo for EWB-SBV.',
    ],
    photos: [chixoyHillside, chixoyRiver, chixoyBanner],
    cardPhoto: chixoyHillside,
    locationMap: chixoyMap,
    updates: [
      {
        heading: 'Project Adoption',
        date: 'November 2025',
        paragraphs: ['EWB-SBV announces a new water supply project in Rio Chixoy, Guatemala.'],
        photos: [],
      },
      {
        heading: 'Assessment Trip',
        date: 'April 2026',
        paragraphs: [
          'EWB-SBV Assessment Team travels to Guatemala to evaluate the project and create a path to completion. Major successes of the assessment trip included:',
          'Water Source Confirmation. We determined the source (natural spring in a small cave) had adequate flow to serve the community and provide for growth to approximately double the number of residents.',
          'Water Quality Confirmation. Our NGO Liaison and the Mayor of San Cristobal Verapaz convinced the Ministry of Health to perform water quality tests on the water source. The test came back clear of all contaminants.',
          'Resident Interviews. The Assessment Team visited every household and gathered information on living conditions, water supply reliability, and desire for the project.',
          'Site Investigation. The Assessment Team walked and drove the route from the source to the community several times to develop alternative alignments and design concepts for the water system, including potential tank/reservoir locations.',
          'Project Agreement. The Assessment Team obtained a fully endorsed project agreement with cost-sharing terms, signed by the San Cristobal Mayor, President of the COCODE, NGO President, and EWB-SBV.',
          'Lasting Relationships. The Assessment Team connected with many residents in addition to our NGO and the COCODE, having hiked, traveled, and shared meals.',
          'Culture and Fun. The Assessment Team managed to work in a little fun, attending a birthday party, helping make a vat of homemade salsa, and catching some local sights.',
          'Special thanks to our local NGO partner, EWB mentor, project team leader, and project team members.',
        ],
        photos: [],
      },
      {
        heading: 'Assessment Trip Report',
        date: 'June 2026',
        paragraphs: [
          'This report outlines the findings in the assessment trip and confirms project feasibility. The report has been submitted to EWB National. June 2026.',
        ],
        photos: [],
      },
      {
        heading: 'Alternative Analysis',
        date: 'October 2026',
        paragraphs: [
          'Develop alternative alignments and potential phasing. Design alternatives will be completed at a schematic level to ensure feasibility. Develop rough cost estimates of alternatives. October 2026.',
        ],
        photos: [],
      },
      {
        heading: 'Select Alternative',
        date: 'January 2027',
        paragraphs: [
          'Review the alternatives and phasing options with the community to confirm desired options to proceed with construction documents. January 2027.',
        ],
        photos: [],
      },
      {
        heading: 'Fundraising',
        date: 'Now through June 2027',
        paragraphs: [
          'Work with EWB National and EWB-SBV Membership to raise sufficient funds for the selected alternative. Now through June 2027.',
        ],
        photos: [],
      },
      {
        heading: 'Prepare Construction Documents',
        date: 'January through June 2027',
        paragraphs: [
          'Prepare plans, specifications, and cost estimate for construction. January through June 2027.',
        ],
        photos: [],
      },
      {
        heading: 'Construction',
        date: 'May through July 2027',
        paragraphs: [
          'Hire a local Construction Manager to obtain bids and manage construction. May through July 2027.',
        ],
        photos: [],
      },
      {
        heading: 'Build the Project',
        date: 'August 2027 through March 2028',
        paragraphs: [
          'Depending on the selected alternative and funding, the project should take between 3-6 months to construct. August 2027 through March 2028.',
        ],
        photos: [],
      },
    ],
    sections: [
      {
        heading: 'Community background',
        paragraphs: [
          'The project is located in Rio Chixoy in the Municipality of San Cristobal Verapaz and Alta Verapaz Department (State) in Guatemala. San Cristobal Verapaz is about 5 hours (80 miles) north of Guatemala City. Rio Chixoy is about 1 hour (15 miles) west of San Cristobal and is immediately adjacent to the Rio Chixoy. In 1985, the Pueblo Viejo Hydroelectric Project was completed, which limits the flow in the river to generate power. In 2020, Rio Chixoy expressed interest in obtaining their own water supply system. In 2022, EWB performed a project Feasibility Investigation. In 2025, EWB-SVB adopted the project for further investigation and implementation. The river loosely follows the border of the Departments of Alta Verapaz and Quiche.',
          'Rio Chixoy has approximately 150 residents in 30 households. The community’s major economic endeavors are agriculture and a gypsum quarry. Rio Chixoy has an estimated 90% of people living in poverty, according to the General Secretariat of Planning and Programming. Rio Chixoy has an elected COCODE (Consejo Comunitario de Desarrollo or Community Development Council), which will act as the Water Board.',
          'The Rio Chixoy Community currently receives water from the Municipality of Chicaman across the river in the Quiche Department. The service is unreliable, often leaving Rio Chixoy without water or water for only an hour or two per day, and the water quality is poor requiring boiling for consumption. A few residents have bottled water delivered for drinking, but most cannot afford water delivery.',
        ],
      },
      {
        heading: 'Project objectives',
        paragraphs: [
          'In 2022, EWB along with the COCODE found what they believed to be a clean water source. The intent of the project is to provide the community with a reliable clean water supply.',
        ],
        items: [
          'Confirm the water source to be reliable, consistent, and clean.',
          'Create a partnership with the City of San Cristobal Verapaz, the COCODE, our NGO, and EWB.',
          'Develop design alternatives to bring water to the community.',
          'Fund, design and build a complete water system from source to user.',
          'Train the community to operate and maintain the physical infrastructure and treat the water.',
          'Develop and maintain a relationship with the COCODE and the Community.',
        ],
      },
    ],
    pageLinks: [
      {
        href: 'https://support.ewb-usa.org/team/790204',
        label: 'Donate to our Río Chixoy Project',
      },
    ],
  },
  {
    slug: 'tanzania-erangau',
    title: 'Tanzania - Erangau',
    place: 'Erangau, northern foothills of Mt. Kilimanjaro, Tanzania',
    status: 'in-progress',
    summary:
      'Water supply project for the Erangau community. Phase 1 construction ran from February to May 2025, and Phase 2 is described on the project page as planned for 2026.',
    notes: [
      'The chapter site spells this community four ways. The page heading uses Erangau, and the background also says Rangau. The site navigation label is Tanzania-Rengau. The objectives say Erengau. The preferred spelling is still unconfirmed.',
    ],
    cardPhoto: erangauTrenchInspection,
    locationMap: erangauMap,
    photos: [
      erangauRoadTrench,
      erangauTrenchInspection,
      erangauPressureTank,
      erangauMainTank,
      erangauTapMasonry,
      erangauTankPlumbing,
      erangauTrenchCrew,
      erangauPressurePiping,
      erangauValve,
      erangauTankMasonry,
      erangauTankInterior,
      erangauBlueTank,
      erangauRedTank,
      erangauTapBuilders,
      erangauTapGroup,
      erangauTapUse,
      erangauTapUse2,
      erangauPhaseMap,
    ],
    updates: [
      {
        heading: 'Phase 1 construction',
        date: 'February - May 2025',
        paragraphs: [
          'Construction from February - May 2025:',
          'Storage Tank',
          '3.75km of water pipe',
          '1 Public Tap Stand',
          'Pressure Reducing Tank',
        ],
        photos: [erangauTankPlumbing],
      },
      {
        heading: 'Trench inspection',
        date: null,
        paragraphs: [erangauTrenchCaption],
        photos: [erangauTrenchInspection, erangauTrenchCrew, erangauRoadTrench],
      },
      {
        heading: 'Pressure reducing tank',
        date: null,
        paragraphs: [erangauPressureCaption],
        photos: [erangauPressureTank, erangauPressurePiping, erangauValve],
      },
      {
        heading: 'Main storage tank',
        date: null,
        paragraphs: [erangauTankCaption],
        photos: [
          erangauMainTank,
          erangauTankMasonry,
          erangauTankInterior,
          erangauBlueTank,
          erangauRedTank,
        ],
      },
      {
        heading: 'Tap stand construction',
        date: null,
        paragraphs: [erangauTapBuildCaption],
        photos: [erangauTapMasonry, erangauTapBuilders, erangauTapGroup],
      },
      {
        heading: 'Tap stand in use',
        date: null,
        paragraphs: [erangauTapUseCaption],
        photos: [erangauTapUse, erangauTapUse2],
      },
      {
        heading: 'Project Phase 2',
        date: '2026',
        paragraphs: [
          'Construction planned for 2026.',
          'Original plans for the Erangau water system called for a total of 3 tap stands spaced across 2 miles through the center of the community. Due to budget constraints, the project was split into 2 parts. Phase 1 was completed in 2025 and is currently delivering water to a portion of the community. Phase 2 will extend the water delivery system to reach many more families.',
          'We need your help to fundraise the additional $35,000 needed to build Phase 2 of the Erangau system!',
        ],
        photos: [erangauPhaseMap],
        link: {
          href: 'https://support.ewb-usa.org/team/86496',
          label: 'Donate Now',
        },
      },
      {
        heading: 'Assessment Trip #1',
        date: 'November 2022',
        paragraphs: [
          'The team assessed the needs of the Erangau Community and identified water sources that are available from the same area as the neighboring Olmoti subvillage. We collected data to understand water demands for system design and surveyed diverse members of the subvillage.',
        ],
        photos: [],
      },
      {
        heading: 'Assessment Trip #2',
        date: 'July 2023',
        paragraphs: [
          'The team verified that the final design and water system location were approved by Water District and Community Leaders. The team set up agreements and a path forward with the community and local authorities. The goal is to implement a water pipeline system for the Erangau/Rangau community, a sub-village of Elerai, to gain closer connections to potable water and maintain the existing EWB-SBV water system.',
        ],
        photos: [],
      },
      {
        heading: 'Implementation Trip - Phase I #1',
        date: 'February 2025',
        paragraphs: [
          'Purchase of materials for phase 1, finalizing phase 1 design, signing agreements with the community and municipalities, and beginning construction.',
        ],
        photos: [],
      },
      {
        heading: 'Implementation Trip - Phase I #2',
        date: 'April 2025',
        paragraphs: [
          'Commissioning of phase 1 including pressure reducing tank, 1 storage tank, 1 tap stand, and pipeline system from the storage tank to tap stand.',
        ],
        photos: [],
      },
      {
        heading: 'Implementation Trip - Phase II',
        date: '2026',
        paragraphs: [
          'Planned for 2026: installation of 2 additional tap stands and extending the pipeline.',
        ],
        photos: [],
      },
    ],
    sections: [
      {
        heading: 'Community background',
        paragraphs: [
          'The project is located in the Erangau (also referred to as “Rangau”) Community of Tanzania in the northern foothills of Mt. Kilimanjaro. The community is located approx. 8 kilometers from the Olmoti clinic project, completed by EWB-USA SBV and the Olmoti community in 2015. Community members from Erangau were peripherally involved in the 2015 project and expressed interest in an extension to their community as early as 2014. Erangau community leaders worked hard to document the demand for water and establish communications with EWB for help to make this project a reality.',
          'The Erangau community consists of 1876 people in 705 families from the Maasai culture. The majority of community members live in traditional houses called bomas, where all family members share the same living area. Traditionally, the women bring water each day for their families to use for drinking, cooking, and bathing. This water is carried on the womens’ backs or with donkeys.',
        ],
      },
      {
        heading: 'Project objectives',
        paragraphs: [
          'The Erangau community has the problem of unreliable local access to clean drinking water. Community members are able collect rain water during some seasons; the remainder of the time they must walk up to 10 km round-trip to the nearest source of treated water.',
        ],
        items: [
          'Providing a local, reliable source of potable water for the community of Erengau.',
          'Installing a new potable water distribution network to the community including a large storage tank, 3 tap stands, pressure reducing tanks, and main transmission lines. The EWB team gathered water demand data to ensure the system is properly sized. The water source would is the same as the previous Olmolti project, treated water from the Simba River, which has sufficient supply to add Erangau to the system according to the Magadini Makiwaru Water Supply of the Tanzania Siha District.',
          'Building the technical capacity of the community to operate and maintain the system long term.',
        ],
      },
    ],
  },
  {
    slug: 'ecuador-el-muyuyo',
    title: 'El Muyuyo, Ecuador',
    place: 'El Muyuyo, Ecuador',
    status: 'completed',
    summary:
      'Water supply project for El Muyuyo, a rural community of approximately 63 families (450 persons).',
    notes: [
      'This page is marked Completed. The project-page update copied below still says the chapter is vetting alternatives and will soon enter the design phase.',
    ],
    cardPhoto: muyuyoWaterContainers,
    locationMap: muyuyoMap,
    photos: [
      muyuyoWaterContainers,
      muyuyo(
        'el-muyuyo-container-closeup.webp',
        'Close view of a water container, from the El Muyuyo project page.',
        1200,
        1600,
      ),
      muyuyo(
        'el-muyuyo-carrying-containers.webp',
        'People carrying water containers, from the El Muyuyo project page.',
        1600,
        1066,
      ),
      muyuyo(
        'el-muyuyo-water-truck.webp',
        'Water truck in the village, from the El Muyuyo project page.',
        1200,
        1600,
      ),
      muyuyo(
        'el-muyuyo-rainwater-barrel.webp',
        'Rainwater collection barrel at a residence, from the El Muyuyo project page.',
        1600,
        1066,
      ),
      muyuyo(
        'el-muyuyo-home-water-storage.webp',
        'Water containers stored at a home, from the El Muyuyo project page.',
        1600,
        1066,
      ),
      muyuyo(
        'el-muyuyo-container-examination.webp',
        'Water container being examined, from the El Muyuyo project page.',
        1200,
        1600,
      ),
      muyuyo(
        'el-muyuyo-yellow-barrel.webp',
        'Yellow barrel beside a building, from the El Muyuyo project page.',
        1200,
        1600,
      ),
      muyuyo(
        'el-muyuyo-black-tank.webp',
        'Black tank on a stand, from the El Muyuyo project page.',
        1200,
        1600,
      ),
      muyuyo(
        'el-muyuyo-clear-container.webp',
        'Clear water container, from the El Muyuyo project page.',
        1200,
        1600,
      ),
      muyuyo(
        'el-muyuyo-blue-container.webp',
        'Blue water container outdoors, from the El Muyuyo project page.',
        1600,
        1200,
      ),
      muyuyo(
        'el-muyuyo-containers-and-bucket.webp',
        'Water containers and a bucket, from the El Muyuyo project page.',
        1600,
        1200,
      ),
      muyuyo('el-muyuyo-hand-pump.webp', 'Hand pump, from the El Muyuyo project page.', 1600, 1200),
      muyuyo(
        'el-muyuyo-handwashing.webp',
        'Handwashing outdoors, from the El Muyuyo project page.',
        1200,
        1600,
      ),
      muyuyo(
        'el-muyuyo-community-meeting.webp',
        'Community meeting, from the El Muyuyo project page.',
        1600,
        1200,
      ),
      muyuyo(
        'el-muyuyo-outdoor-gathering.webp',
        'People gathered outdoors, from the El Muyuyo project page.',
        1600,
        1200,
      ),
      muyuyo(
        'el-muyuyo-seated-group.webp',
        'People seated together indoors, from the El Muyuyo project page.',
        1600,
        1066,
      ),
      muyuyo(
        'el-muyuyo-meeting-table.webp',
        'People seated around a table, from the El Muyuyo project page.',
        1600,
        1066,
      ),
      muyuyoCommunityGathering,
      muyuyo(
        'el-muyuyo-outdoor-meeting.webp',
        'Outdoor meeting, from the El Muyuyo project page.',
        1600,
        1066,
      ),
      muyuyo(
        'el-muyuyo-group-photo.webp',
        'Group photograph from the El Muyuyo project page.',
        1600,
        1066,
      ),
      muyuyo(
        'el-muyuyo-assessment-group.webp',
        'Group photograph from the El Muyuyo project page.',
        1600,
        1066,
      ),
      muyuyo(
        'el-muyuyo-volunteers-outdoors.webp',
        'People standing together outdoors, from the El Muyuyo project page.',
        1600,
        1066,
      ),
      muyuyo(
        'el-muyuyo-site-survey.webp',
        'People looking over papers outdoors, from the El Muyuyo project page.',
        1600,
        1066,
      ),
      muyuyo(
        'el-muyuyo-water-quality-test.webp',
        'Water testing outdoors, from the El Muyuyo project page.',
        1600,
        1066,
      ),
      muyuyo(
        'el-muyuyo-village-path.webp',
        'Dirt path and vegetation, from the El Muyuyo project page.',
        1600,
        1066,
      ),
      muyuyo(
        'el-muyuyo-houses.webp',
        'Houses and a dirt road, from the El Muyuyo project page.',
        1600,
        1200,
      ),
      muyuyo('el-muyuyo-landscape.webp', 'Landscape from the El Muyuyo project page.', 1600, 1066),
      muyuyo(
        'el-muyuyo-village-clearing.webp',
        'Cleared ground and trees, from the El Muyuyo project page.',
        1200,
        1600,
      ),
      muyuyo(
        'el-muyuyo-tank-drawing.webp',
        'Tank drawing from the El Muyuyo project page. The page says the intended tank will resemble this drawing.',
        999,
        473,
      ),
      muyuyo(
        'el-muyuyo-tank-schematic.webp',
        'Engineering drawing of a storage tank and tap stand, from the El Muyuyo project page.',
        1600,
        1066,
      ),
    ],
    updates: [
      {
        heading: 'Project update',
        date: 'July 2023',
        paragraphs: [
          'We completed our 2nd Assessment Trip in July 2023 and are currently vetting multiple alternatives and will soon enter the design phase of the project.',
        ],
        photos: [],
      },
    ],
    sections: [
      {
        heading: 'Community background',
        paragraphs: [
          'El Muyuyo is a small rural community of approximately 63 families (450 persons). This growing community depends on agriculture and other seasonal employment income. Some community members travel to the cities and work in seasonal construction or other trades.',
        ],
      },
      {
        heading: 'Community water supply (currently)',
        paragraphs: [
          'Residents of El Muyuyo suffer from a chronic shortage of potable drinking water. El Muyuyo collects rainwater during the region’s wet season (January to May). During the dry season, community members transport water to their houses from the closest water source by truck. Some members hire a water transport service, but not all can afford this convenience.',
        ],
      },
      {
        heading: 'Project goals',
        paragraphs: [
          'Our hope and aspiration is to provide the community with a reliable, lower-cost, and SAFE water supply. We will design and construct a durable, easily maintainable storage tank and a nearby tap stand for the community to utilize in the village center. The tank will then be connected to a nearby water treatment plant currently being built by the regional municipality. The community itself will contribute 5% of funds and provide labor during implementation. We envision the tank we intend to build will resemble the tank drawing below.',
          'Please join us! We need Engineers AND Non-Engineers! Please contact Ecuador@ewb-sbv.org for more information on the Ecuador Project or inquiries on how to get involved.',
        ],
      },
    ],
  },
  {
    slug: 'tanzania-olmoti',
    title: 'Tanzania - Olmoti',
    place: 'Olmoti, Tanzania',
    status: 'completed',
    summary:
      'The first project completed by the EWB-SBV chapter. The project page says it was initiated in 2013.',
    notes: [
      'The page title uses Olmoti. The page address is tanzania-olmolti. The Erangau page calls this the previous Olmolti project and says the Olmoti clinic project was completed in 2015. Both spellings are kept. This page is marked completed.',
    ],
    photos: [olmotiPortrait, olmotiTap, olmotiCommunityTap, olmotiPipeline, olmotiTank],
    cardPhoto: olmotiPortrait,
    locationMap: olmotiMap,
    updates: [
      {
        heading: 'Community background',
        date: null,
        paragraphs: [
          'The Tanzania project, initiated in 2013, was the first project completed by the EWB-SBV chapter. EWB-USA SBV designed and constructing a 6km pipeline connecting two storage tanks (one in the center of the Olmoti community and the other at the Olmoti clinic) as well as several distribution sites to meet the drinking water demand of the clinic and surrounding Maasai community.',
        ],
        photos: [],
      },
    ],
    sections: [],
  },
];

export function projectBySlug(slug: string | null | undefined): ProjectRecord | undefined {
  if (!slug) {
    return undefined;
  }
  return PROJECTS.find((project) => project.slug === slug);
}

export function projectsByStatus(status: ProjectStatus): readonly ProjectRecord[] {
  return PROJECTS.filter((project) => project.status === status);
}
