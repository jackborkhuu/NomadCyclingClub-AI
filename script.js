const navToggle = document.getElementById('navToggle');
const siteNav = document.getElementById('siteNav');

navToggle?.addEventListener('click', () => {
  siteNav?.classList.toggle('open');
});

const DONATE_CASH_TAG = '$NomadCyclingClub';
const DONATE_URL = `https://cash.app/${encodeURIComponent(DONATE_CASH_TAG)}`;
const DONATE_QR_URL = 'assets/donate-qr.png';

function ensureDonateLinks() {
  const navGroups = document.querySelectorAll('.tabs, .site-nav');
  navGroups.forEach((group) => {
    if (group.querySelector('.donate-trigger')) {
      return;
    }

    const donateLink = document.createElement('a');
    donateLink.href = '#donate';
    donateLink.className = group.classList.contains('tabs') ? 'tab donate-trigger' : 'donate-trigger';
    donateLink.setAttribute('aria-label', 'Donate to Nomad Cycling Club');
    donateLink.textContent = 'Donate';

    const links = [...group.querySelectorAll('a')];
    const contactLink = links.find((link) => (link.getAttribute('href') || '').includes('contact.html'));

    if (contactLink && contactLink.parentNode === group) {
      contactLink.insertAdjacentElement('afterend', donateLink);
    } else {
      group.appendChild(donateLink);
    }
  });
}

function initDonateModal() {
  const donateLinks = document.querySelectorAll('.donate-trigger');
  if (donateLinks.length === 0) {
    return;
  }

  if (!document.getElementById('donateModal')) {
    const modalMarkup = `
      <div class="donate-modal" id="donateModal" aria-hidden="true" role="dialog" aria-label="Donate with QR code">
        <div class="donate-modal-card">
          <button class="donate-modal-close" id="donateModalClose" aria-label="Close donate popup">&times;</button>
          <h3>Support Nomad Cycling Club</h3>
          <p>Scan this QR code with Cash App to donate.</p>
          <img class="donate-qr-image" src="${DONATE_QR_URL}" alt="Cash App donation QR for Nomad Cycling Club" loading="lazy" />
          <p class="donate-cashtag">${DONATE_CASH_TAG}</p>
          <a class="button button-primary donate-open-link" href="${DONATE_URL}" target="_blank" rel="noopener">Open in Cash App</a>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalMarkup);
  }

  const modal = document.getElementById('donateModal');
  const closeButton = document.getElementById('donateModalClose');

  const openModal = () => {
    if (!modal) {
      return;
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  };

  const closeModal = () => {
    if (!modal) {
      return;
    }

    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  };

  donateLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      openModal();
    });
  });

  closeButton?.addEventListener('click', closeModal);

  modal?.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal?.classList.contains('open')) {
      closeModal();
    }
  });
}

ensureDonateLinks();
initDonateModal();

const facebookPhotos = [
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/473013051_2432302783779151_4367558447526915791_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=2a1932&_nc_ohc=2DqLnHDwqkgQ7kNvwGxpYY7&_nc_oc=Adro7iJVgVzbq6SummMGUmd68gYFfSryVKi0FvQyLcHsley_MQ9IUaiKhHRoJSAXbNM&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=jdN_sHT-EBAAJIJ0ZC0gQw&_nc_ss=7b2a8&oh=00_Af4AybgHrTogoWi73qF3KoKxrGtlG4YxKye0jXJBKnW3Jg&oe=6A07E6B7',
    alt: 'Nomad Cycling Club cover ride',
    title: 'Cover ride',
    date: '2022-08-15'
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/673625921_1637213444518307_5611692299590495681_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=107&ccb=1-7&_nc_sid=7b2446&_nc_ohc=XMCWLhA7ivMQ7kNvwF6Gpzm&_nc_oc=AdrVVEfwaswkK9-vdH-3nm3ubNRZFok2XB_UpDP1rUBH1083_RK93o1YBkqy-L0e_8Y&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=_c4g0HlUc6xXnNHQukpKWg&_nc_ss=7b289&oh=00_Af4qtLpypEaDcDQMfOzvUTaTUDfzEUONQx6_uSLj5S6abg&oe=6A07F72F',
    fullSrc: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/673625921_1637213444518307_5611692299590495681_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=107&ccb=1-7&_nc_sid=7b2446&_nc_ohc=XMCWLhA7ivMQ7kNvwF6Gpzm&_nc_oc=AdrVVEfwaswkK9-vdH-3nm3ubNRZFok2XB_UpDP1rUBH1083_RK93o1YBkqy-L0e_8Y&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=qaDqrN0Mz-aHjEfqOFp77w&_nc_ss=7b289&oh=00_Af6-xCn41SEsULvG7BdUvhLAq5xN2tmt9_47_aV7cOq1jg&oe=6A082F6F',
    alt: 'Club ride archive photo 1',
    title: 'Facebook archive photo',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/672683099_1637213437851641_7228904326571331058_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=7b2446&_nc_ohc=DijEINDBPKEQ7kNvwFzFeHh&_nc_oc=AdpoDMg1Vg_eVVf7-HZq7koRuc3WnMAsWU4esNWoUT0bGDn6np5eB3uww4midIJQzdw&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=NWIyd6DrgIWed5MMBMmwcQ&_nc_ss=7b289&oh=00_Af4gSwCPnb8waySHAeGh1YkMCUu6638_4lrHEAJ_uMRucA&oe=6A07FE31',
    fullSrc: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/672683099_1637213437851641_7228904326571331058_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=7b2446&_nc_ohc=DijEINDBPKEQ7kNvwFzFeHh&_nc_oc=AdpoDMg1Vg_eVVf7-HZq7koRuc3WnMAsWU4esNWoUT0bGDn6np5eB3uww4midIJQzdw&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=SRc0vFTsv-DTPJWT_qxwRg&_nc_ss=7b289&oh=00_Af62wzPxSddz1v23wRwsDx2dlP31-h1ups-RyARsGl4Duw&oe=6A07FE31',
    alt: 'Club ride archive photo 2',
    title: 'Facebook archive photo',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/673535871_1637213414518310_7903495935145392462_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=7b2446&_nc_ohc=RhRRNJswA_cQ7kNvwEt9qUa&_nc_oc=AdpmouZtIJ5_2j_kpq8UyejV_hi3o75kUpSVoztm0dWCX5rX95X_ua2d2cg1uc5Z3ns&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=o5lQXyqyrQhUhTytC4-GPQ&_nc_ss=7b289&oh=00_Af4xx4qztXjiOQYBJZL3bhksStJDgZG9BQbtvvb_JTs3KA&oe=6A082523',
    fullSrc: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/673535871_1637213414518310_7903495935145392462_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=7b2446&_nc_ohc=RhRRNJswA_cQ7kNvwEt9qUa&_nc_oc=AdpmouZtIJ5_2j_kpq8UyejV_hi3o75kUpSVoztm0dWCX5rX95X_ua2d2cg1uc5Z3ns&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=gYKlr5TOJCzJ0FNiP3HGDw&_nc_ss=7b289&oh=00_Af7cXGQFK4304XTtf5lTTZtJHZTj3K6_uzxhkaEWD19PCA&oe=6A082523',
    alt: 'Club ride archive photo 3',
    title: 'Facebook archive photo',
    date: null
  },
  {
    src: 'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/672643464_1637213431184975_1515063720095141462_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=101&ccb=1-7&_nc_sid=7b2446&_nc_ohc=S5ej16cRdd0Q7kNvwF7nFKF&_nc_oc=AdpjQp1ODCxCeNe92ZhbUFlVilB6RylOAk2SWSQ-T3bkqQkMIy-NId9NHxc16VLAn7o&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=k2TvIU6P3CB7tdS2ms1OcA&_nc_ss=7b289&oh=00_Af6t_gQ2jfecFcHqCDJMNVLGmrRoNwimq5jQQThsg41VRg&oe=6A0804D3',
    fullSrc: 'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/672643464_1637213431184975_1515063720095141462_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=101&ccb=1-7&_nc_sid=7b2446&_nc_ohc=S5ej16cRdd0Q7kNvwF7nFKF&_nc_oc=AdpjQp1ODCxCeNe92ZhbUFlVilB6RylOAk2SWSQ-T3bkqQkMIy-NId9NHxc16VLAn7o&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=F645uD67NF9txL9CD76MNQ&_nc_ss=7b289&oh=00_Af6s5oUaHjTi84mGfJrzUtsTYBn6-6sd5SFHRXFfRzA0kw&oe=6A0804D3',
    alt: 'Club ride archive photo 4',
    title: 'Facebook archive photo',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/607950584_1545940523645600_7370249189459747437_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=7b2446&_nc_ohc=d6r2XKgz5rMQ7kNvwGk8-1y&_nc_oc=AdpjDo1UMJrXMBi-tKlU_OtK1_fCpjbvGEBcM2KS1cIApzUh5i4V67NqbbRV3odCBFo&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=xXbmXiK1g5tdOokut_nY5Q&_nc_ss=7b289&oh=00_Af6xLmyeY1jqfkqI01Dwie20bI3UPJsJVFnoaVJb1zIAEw&oe=6A080B06',
    fullSrc: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/607950584_1545940523645600_7370249189459747437_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=7b2446&_nc_ohc=d6r2XKgz5rMQ7kNvwGk8-1y&_nc_oc=AdpjDo1UMJrXMBi-tKlU_OtK1_fCpjbvGEBcM2KS1cIApzUh5i4V67NqbbRV3odCBFo&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=-qBjMjt5vAxoEH3gJvQq-A&_nc_ss=7b289&oh=00_Af5lvWhqKwIYPsSU7_SbjM7ExmtAa05JDZrRCgjwMTH2MA&oe=6A080B06',
    alt: 'Club archive photo from the Facebook page',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/574390030_1493128615593458_7589757113301233912_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=7b2446&_nc_ohc=ZwoZNMuZ1I4Q7kNvwFbCWER&_nc_oc=AdpPHgE9PoqdPRQxfoMcEp6mcAs7Fq57h5dYXMeVCu3OpSu9lJPKQalsLMNeIKDhrpc&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=zBF5CE0pd4GuczGwTD74Mw&_nc_ss=7b289&oh=00_Af5Na7dsqTqQQAdDimg7alm8LrwfzUsD_2_hUl8cO36pVg&oe=6A07FF8E',
    fullSrc: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/574390030_1493128615593458_7589757113301233912_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=7b2446&_nc_ohc=ZwoZNMuZ1I4Q7kNvwFbCWER&_nc_oc=AdpPHgE9PoqdPRQxfoMcEp6mcAs7Fq57h5dYXMeVCu3OpSu9lJPKQalsLMNeIKDhrpc&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=KU0wW7oGmelCvdQTozJP5g&_nc_ss=7b289&oh=00_Af4Oqo4fPpmcxofypS5ScaX2rRtQTf9iUP9SQW00U4hHBw&oe=6A07FF8E',
    alt: 'Club archive photo from November 2, 2025',
    title: 'Archive ride',
    date: '2025-11-02'
  },
  {
    src: 'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/573891801_1493128602260126_3070074279857641340_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=7b2446&_nc_ohc=V0sg0KEHtkMQ7kNvwGp9jLL&_nc_oc=Adq9Kxze8BQg4cyfgal0fQA7CCvTgwyD8LXPBiLHB8bG0I7j59j0aly6O0Kaa0Vpbj8&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=q-CNl_Bml224eZYcua3bNw&_nc_ss=7b289&oh=00_Af4ydW-cSJU6zA6_VzAQ2KigcaQyso9OzajElZPJkxZXSw&oe=6A080FA1',
    fullSrc: 'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/573891801_1493128602260126_3070074279857641340_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=7b2446&_nc_ohc=V0sg0KEHtkMQ7kNvwGp9jLL&_nc_oc=Adq9Kxze8BQg4cyfgal0fQA7CCvTgwyD8LXPBiLHB8bG0I7j59j0aly6O0Kaa0Vpbj8&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=7jR6ZrcCkCKBmU3VDWIzzw&_nc_ss=7b289&oh=00_Af4y--0HDORJPVYRZLJrbY1P2ggo1WGUygyU5R3Rwb6KTw&oe=6A080FA1',
    alt: 'Club archive photo from November 2, 2025',
    title: 'Archive ride',
    date: '2025-11-02'
  },
  {
    src: 'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/574034432_1493128632260123_628460640214557466_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=7b2446&_nc_ohc=kOq_sVn1SxkQ7kNvwHthGr2&_nc_oc=Adp71Hgw2Vj_Cl_AwY9kiOT-5B1neOGyB3RkGJecW57Ry4MoqgaZeusXepwuU4mccxs&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=x6Pw0DqOsUEBKNs-4lteWQ&_nc_ss=7b289&oh=00_Af7zH3CPeEUYgzHxSwUDr8fHp08BT6vWvlvojU3x7JPFag&oe=6A07FFC2',
    fullSrc: 'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/574034432_1493128632260123_628460640214557466_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=7b2446&_nc_ohc=kOq_sVn1SxkQ7kNvwHthGr2&_nc_oc=Adp71Hgw2Vj_Cl_AwY9kiOT-5B1neOGyB3RkGJecW57Ry4MoqgaZeusXepwuU4mccxs&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=HiCFbwLB_FKWyozbSfN74A&_nc_ss=7b289&oh=00_Af5nYZG2Tmb3JKCabYtaZN1vjxsZafAw9dzCdmGvFJl8ug&oe=6A07FFC2',
    alt: 'Club archive photo from November 2, 2025',
    title: 'Archive ride',
    date: '2025-11-02'
  },
  {
    src: 'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/573374469_1493127725593547_5547752852223608786_n.jpg?stp=c210.0.540.540a_dst-jpg_s206x206_tt6&_nc_cat=104&ccb=1-7&_nc_sid=5df8b4&_nc_ohc=E80XUI34XBgQ7kNvwHomNbr&_nc_oc=AdqP6Ys04WIf7auSNA6RrWSRSP-q8dQ_3DsfBBxOFLewgA03QEbUdDpHR7YYaKyzFxU&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=jE_fGkkO9VHC49CdFQBBLg&_nc_ss=7b289&oh=00_Af74zWFLkYGdJzXVdURC4jEUtq7c3ToRE2v3O5UpubkbbQ&oe=6A07FF4A',
    fullSrc: 'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/573374469_1493127725593547_5547752852223608786_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=7b2446&_nc_ohc=E80XUI34XBgQ7kNvwHomNbr&_nc_oc=AdqP6Ys04WIf7auSNA6RrWSRSP-q8dQ_3DsfBBxOFLewgA03QEbUdDpHR7YYaKyzFxU&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=OtO5q_CcNLZzGprN_BSqPA&_nc_ss=7b289&oh=00_Af7cqREtYuqaybl5ZVv6KmqBjqRttYFZcAyTJdQHMYtZlg&oe=6A07FF4A',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/576469767_1493128565593463_8311896667144904990_n.jpg?stp=c0.169.1536.1536a_dst-jpg_s206x206_tt6&_nc_cat=101&ccb=1-7&_nc_sid=5df8b4&_nc_ohc=J5tQRiuUE_IQ7kNvwHjr0sz&_nc_oc=AdoffP_fFJgM_W3och8QHosk7BgYUemSCft5hbZZE6AdZcj__RHEJLPiyy9Rt4qFbDg&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=jE_fGkkO9VHC49CdFQBBLg&_nc_ss=7b289&oh=00_Af5uua2R8yKT7UOerxgV_Ahrf__dNcsCnWs3xtwcDxwzug&oe=6A07FBC9',
    fullSrc: 'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/576469767_1493128565593463_8311896667144904990_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=7b2446&_nc_ohc=J5tQRiuUE_IQ7kNvwHjr0sz&_nc_oc=AdoffP_fFJgM_W3och8QHosk7BgYUemSCft5hbZZE6AdZcj__RHEJLPiyy9Rt4qFbDg&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=_MMVIkUu4vRZSk4HqfDYDw&_nc_ss=7b289&oh=00_Af6KRHf3Mun1qUkZ0GSEr4pJHW0dT3Rr-2emikiRk9NgAA&oe=6A07FBC9',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/573923631_1493128558926797_956038550251571563_n.jpg?stp=c256.0.1536.1536a_dst-jpg_s206x206_tt6&_nc_cat=105&ccb=1-7&_nc_sid=5df8b4&_nc_ohc=RDxdHpZ3H2oQ7kNvwFZQYV_&_nc_oc=AdpLyDOYSCiTDrrWPeWbZjPEa5DrOKv0P-e2qOxSpQOFzk4Z_-2kdJ8tVCd72NdGpEg&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=jE_fGkkO9VHC49CdFQBBLg&_nc_ss=7b289&oh=00_Af6f5bCM3z04ty-6hlzFfHYB8sChapuhe-03bGM2GOpIaw&oe=6A07FA2A',
    fullSrc: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/573923631_1493128558926797_956038550251571563_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=7b2446&_nc_ohc=RDxdHpZ3H2oQ7kNvwFZQYV_&_nc_oc=AdpLyDOYSCiTDrrWPeWbZjPEa5DrOKv0P-e2qOxSpQOFzk4Z_-2kdJ8tVCd72NdGpEg&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=Los3JAbCwCn65t4rowhLiQ&_nc_ss=7b289&oh=00_Af7p8l3ldQgOYEnCCIdZn_xyu9nYHRF09UpPUJGQUEFf5g&oe=6A08326A',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/549715556_1448003536772633_4648318552302692281_n.jpg?stp=c164.0.992.992a_cp6_dst-jpg_s206x206_tt6&_nc_cat=110&ccb=1-7&_nc_sid=5df8b4&_nc_ohc=1zx0SHMnaHAQ7kNvwEfjHyt&_nc_oc=AdqY67gtvMXMd5Xp_y2YusdDgNHbhnXF74YIt9SPDblbJQaQ5oJMXB3C4lRvwT1YSYI&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=jE_fGkkO9VHC49CdFQBBLg&_nc_ss=7b289&oh=00_Af5pTn1tCNETqeR-o_KhD_jGCUzgsHn9FQOaI3MOKNK_9w&oe=6A0800FC',
    fullSrc: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/549715556_1448003536772633_4648318552302692281_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=110&ccb=1-7&_nc_sid=7b2446&_nc_ohc=1zx0SHMnaHAQ7kNvwEfjHyt&_nc_oc=AdqY67gtvMXMd5Xp_y2YusdDgNHbhnXF74YIt9SPDblbJQaQ5oJMXB3C4lRvwT1YSYI&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=twtwxK2DQxClGpklq-l1cw&_nc_ss=7b289&oh=00_Af5GaKFSVmwpKr-Qeo8eqA3zDI4plIUTd6v8MwnPGF-5mA&oe=6A0800FC',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/548723599_1448003550105965_2989915834329744314_n.jpg?stp=c553.0.943.943a_cp6_dst-jpg_s206x206_tt6&_nc_cat=108&ccb=1-7&_nc_sid=5df8b4&_nc_ohc=MQQ7Y8UIn6cQ7kNvwGFe6zA&_nc_oc=AdqIuUCvreqS_nZ1Y3IxPyGddfXETZPyMa4VVU9a6hxj1C4Kwk1o6UBp3V0w3y8-5dw&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=jE_fGkkO9VHC49CdFQBBLg&_nc_ss=7b289&oh=00_Af4uuFgmpBjAqp27utUkxbYPc4ae4L17zxCpDSgnqUOQwg&oe=6A081443',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/547646100_1448003506772636_2683809327190524157_n.jpg?stp=c256.0.1536.1536a_dst-jpg_s206x206_tt6&_nc_cat=111&ccb=1-7&_nc_sid=5df8b4&_nc_ohc=4PzIIULe8AQQ7kNvwGBOviB&_nc_oc=AdoBGLfx8ORWHK5S48xM4M6_XMVKlmTT06SdUaB0peNUEBkAARVcnbz4hviRRDKxy_c&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=jE_fGkkO9VHC49CdFQBBLg&_nc_ss=7b289&oh=00_Af5iKzDT27gbUR-xjWAhhNsSNFXJ24U_HItb_5cwvQBlGQ&oe=6A081E67',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/547455296_1448003500105970_3265662309900955788_n.jpg?stp=c256.0.1536.1536a_dst-jpg_s206x206_tt6&_nc_cat=109&ccb=1-7&_nc_sid=5df8b4&_nc_ohc=--coMsViPV0Q7kNvwHYGCe6&_nc_oc=AdrM7ErdTCmWlLIlH6BNtAlcuwyrLCH9lbl7EF7Y5cQIyuE1FQEY20MhLit3R7ryzsE&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=jE_fGkkO9VHC49CdFQBBLg&_nc_ss=7b289&oh=00_Af47dlE_gO24HkiPPUa4ofgz45UyjdUI6dbRICMGXD7PLw&oe=6A0808B8',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/520293361_1396853558554298_776466652404772281_n.jpg?stp=c360.0.600.600a_dst-jpg_s206x206_tt6&_nc_cat=107&ccb=1-7&_nc_sid=5df8b4&_nc_ohc=p8xMBImG9P0Q7kNvwHObcVh&_nc_oc=Adq703owLkULvbWMFgF4WdY47TOTpQUJtr20aVnb-EJ5BQhd36k9LRUmR4N_KlQ3wj8&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=jE_fGkkO9VHC49CdFQBBLg&_nc_ss=7b289&oh=00_Af6Tj1TlZ9mdKO0KAbwcUXMqbGOYEcNXekpFMVahG1Drog&oe=6A08032E',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/493982209_1328772302029091_374628181166287241_n.jpg?stp=c0.169.1536.1536a_dst-jpg_s206x206_tt6&_nc_cat=107&ccb=1-7&_nc_sid=5df8b4&_nc_ohc=lcoBvUVXg9UQ7kNvwFeZn0i&_nc_oc=AdqRM0TJW_IsFZsO_XbrTX-1CWXO-EWLD-IeKTz22J-B4ZTH_aSG9HEo-CiLaBNmzTI&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=RdVPNZPgBHolCSrL6WQuQw&_nc_ss=7b289&oh=00_Af6zPWO_VHoVcoC_7tpJrocikDzBkHUA3HQQnceWuVT3lA&oe=6A082138',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/493993822_1328773985362256_3554910033961218563_n.jpg?stp=c0.169.1536.1536a_dst-jpg_s206x206_tt6&_nc_cat=111&ccb=1-7&_nc_sid=5df8b4&_nc_ohc=1Nfv8i0Nwj8Q7kNvwEgjGQz&_nc_oc=Adq4-jHtlJvv1P1pvCvbfTYwPYfOntDdYF9FCdzOmU-2t1zbm4PKCq9Xiy3tWl2dGmc&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=RdVPNZPgBHolCSrL6WQuQw&_nc_ss=7b289&oh=00_Af7YNgYJ_t0eV29baerIrUSx0-9bCZMMd70eS0DNXWmCTw&oe=6A07FB2D',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/491840374_1322662695973385_6246702159607105157_n.jpg?stp=c256.0.1536.1536a_dst-jpg_s206x206_tt6&_nc_cat=105&ccb=1-7&_nc_sid=5df8b4&_nc_ohc=QOp5F6oXlOUQ7kNvwGegJ_a&_nc_oc=Ado85DkO7xvFD3pyQRXTKdAITs0InBi982D0B8ql8wlcy-BZn-mtvjb0lXh_VyYlPhc&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=RdVPNZPgBHolCSrL6WQuQw&_nc_ss=7b289&oh=00_Af6mN0SU8q98WGigsKmrusJNn-6V30xUWkBfQQgbjjcmbg&oe=6A081B7C',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/491445977_1322662272640094_1731749990350305946_n.jpg?stp=c0.169.1536.1536a_dst-jpg_s206x206_tt6&_nc_cat=102&ccb=1-7&_nc_sid=5df8b4&_nc_ohc=amznXrsC5cgQ7kNvwHLTnI9&_nc_oc=Adpz3h-DXTs0iH8tElJ06YczvLLsubwuusiUCOk-qXNo5oQl0vOXgQqc5U0DSfMh2XY&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=RdVPNZPgBHolCSrL6WQuQw&_nc_ss=7b289&oh=00_Af6eK4F-QTXXJ-qJT6Rq5WNg1Sa75qTPXyLiPUPnIdRL2Q&oe=6A081C40',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/489553677_1310107440562244_4634812104059425717_n.jpg?stp=c0.296.1152.1152a_cp6_dst-jpg_s206x206_tt6&_nc_cat=104&ccb=1-7&_nc_sid=5df8b4&_nc_ohc=Ackahjp3bv4Q7kNvwFFYyLa&_nc_oc=Adq1UXLQ9DJe9VGkWdaYW3XZIQd6I38OKqfq4JkXPL0ZdBgMRs7wgRxOxkKxVhjw-14&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=RdVPNZPgBHolCSrL6WQuQw&_nc_ss=7b289&oh=00_Af675l8eE4SoOVKaSRtqnbnv5W4GSWtZIPbcWJMegrR99w&oe=6A07FE2C',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/488566338_1310107223895599_303539282409666909_n.jpg?stp=c448.0.1152.1152a_cp6_dst-jpg_s206x206_tt6&_nc_cat=104&ccb=1-7&_nc_sid=5df8b4&_nc_ohc=9y9Qrvp3FnwQ7kNvwFqSRgE&_nc_oc=AdqN2faVEXutbFl5I8_FEPjLs58ey9qc1rgFEoTxpiiDqDlHvTkRE5sB9jUZGqJxAo4&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=RdVPNZPgBHolCSrL6WQuQw&_nc_ss=7b289&oh=00_Af6HasfpC-2gwjt18sfeDh0fWOZ8BZq3N9Vl0JC9cupIgw&oe=6A0826BC',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/488615640_1310107423895579_428050740681099241_n.jpg?stp=c448.0.1152.1152a_cp6_dst-jpg_s206x206_tt6&_nc_cat=102&ccb=1-7&_nc_sid=5df8b4&_nc_ohc=qF_VAPSzA4gQ7kNvwFiKIvc&_nc_oc=AdqeZH0FZM8_Zpvchv4a58XvZ9SRi1uzVvaXfr9vooEw0yH_U8RPeV7m8p9ukchhKP4&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=RdVPNZPgBHolCSrL6WQuQw&_nc_ss=7b289&oh=00_Af5cffP_UQ9ebmWfEft0GaKhm3LpUorpR7E5hoYfieIDXQ&oe=6A07FDE5',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/489503393_1310107007228954_5696515006301429549_n.jpg?stp=c448.0.1152.1152a_cp6_dst-jpg_s206x206_tt6&_nc_cat=108&ccb=1-7&_nc_sid=5df8b4&_nc_ohc=jfBftdpQzF4Q7kNvwEbMune&_nc_oc=AdobG7UGTS3Jb-EOXYkvIvwPrl8_6KcjYpMGRBCU4zFASWXGfx8QMf0cYlvIk89RWCY&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=RdVPNZPgBHolCSrL6WQuQw&_nc_ss=7b289&oh=00_Af4GwPNqfgH1B0Pob47pw81tdYwNNTmg715PpYpve_1DBg&oe=6A081F80',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/489027217_1310107047228950_1149573966605870278_n.jpg?stp=c448.0.1152.1152a_cp6_dst-jpg_s206x206_tt6&_nc_cat=107&ccb=1-7&_nc_sid=5df8b4&_nc_ohc=r_6FzKvA2NEQ7kNvwGAtR7L&_nc_oc=AdowO9qrO3svOlzb7KTFGBle9eDveFu0EOnz73sC0w3xXAZMxXg0rM740IV8WD2w4Es&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=gD0bhcKeOJzKholPmBUOEA&_nc_ss=7b289&oh=00_Af6UdQ-OhclzCrSqyhlPVDoRMm1l36jaheCIoc-cY41DLA&oe=6A08072C',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/489027088_1310107000562288_5360028761265217842_n.jpg?stp=c448.0.1152.1152a_cp6_dst-jpg_s206x206_tt6&_nc_cat=103&ccb=1-7&_nc_sid=5df8b4&_nc_ohc=olb5ne255_4Q7kNvwEVhjyT&_nc_oc=AdoC-zRGBWmFtXwgiwXSXduqNbONITRVNVGpwUV4Dr5aGvyQtAIfe7z7VBjTk36954Y&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=gD0bhcKeOJzKholPmBUOEA&_nc_ss=7b289&oh=00_Af6X0niRYSuJqRNtKGpG-HCo6xvauhTzZnfVN7Y6q_LYiA&oe=6A07F1D8',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/488546570_1310107267228928_4662144639266566876_n.jpg?stp=c448.0.1152.1152a_cp6_dst-jpg_s206x206_tt6&_nc_cat=110&ccb=1-7&_nc_sid=5df8b4&_nc_ohc=QZxElpZx0KYQ7kNvwEsO_aw&_nc_oc=AdqsfeEUCxNMFiqc-X4DMJFD_qjbuIXNcpJrbRRgd5KIW8-fCuNN0ZK_OuA6Dw-sVlg&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=gD0bhcKeOJzKholPmBUOEA&_nc_ss=7b289&oh=00_Af5HurOlYr4OVo_ustfmKgC2dVlDNPQVqNs8oL-jqqtxAA&oe=6A080C0E',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/488571345_1308339584072363_5698708514327297594_n.jpg?stp=c342.0.1365.1365a_dst-jpg_s206x206_tt6&_nc_cat=108&ccb=1-7&_nc_sid=a934a8&_nc_ohc=-avPhO8IAyAQ7kNvwGrf8tc&_nc_oc=Ado4C0fIeCUeufUFBmcMSi_ceIB7zOInK1CfQbNVGYxiQRkK-FmIt7MOwRMUUVY6Yko&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=gD0bhcKeOJzKholPmBUOEA&_nc_ss=7b289&oh=00_Af5PxyNj23ZXf56SJ6NrtnjUFc1PJB39rt91Z59lDawXiw&oe=6A07F21F',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/488659282_1308339467405708_5434926097325623031_n.jpg?stp=c342.0.1365.1365a_dst-jpg_s206x206_tt6&_nc_cat=104&ccb=1-7&_nc_sid=a934a8&_nc_ohc=JhHn8odn-_8Q7kNvwHYpQUF&_nc_oc=AdqHPJnPRAIWPFo04UYWaM4Cqn85njhGXZOHPt2aN0mGR1UV2Qpps8jFH_miEoT0VIk&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=gD0bhcKeOJzKholPmBUOEA&_nc_ss=7b289&oh=00_Af79SimpQiCAhO6b_WPf_ptzLvuNMsn9D9qPqeD1XVlF1g&oe=6A080BB2',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/488793005_1308339764072345_4753571484787772510_n.jpg?stp=c342.0.1365.1365a_dst-jpg_s206x206_tt6&_nc_cat=100&ccb=1-7&_nc_sid=a934a8&_nc_ohc=jyy6TI0Zn0EQ7kNvwFwYYsT&_nc_oc=Adr_m_O8pEhKtQlOfSw7r6_zci5Kqvpf2MQUidH0NpGQ5p1kvOitc_Wso3p9HzVCMhk&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=gD0bhcKeOJzKholPmBUOEA&_nc_ss=7b289&oh=00_Af7GrTx2vaL03GelLDVabQVbfm4C6RGPo087_IdqFasmIw&oe=6A081EAB',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/488654961_1308339530739035_7323435807518980619_n.jpg?stp=c342.0.1365.1365a_dst-jpg_s206x206_tt6&_nc_cat=105&ccb=1-7&_nc_sid=a934a8&_nc_ohc=XWDAG748jE4Q7kNvwGZoxnJ&_nc_oc=AdoTiyY3IOMNsd-1fVtpLFWHT_EuxMHIweqQRNE_vUdA1pgikXYsk--xIJ3_K5B6rmA&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=gD0bhcKeOJzKholPmBUOEA&_nc_ss=7b289&oh=00_Af4LlPxGHvG4gyESJMFez0Amd8cZJFhJJO_NZ3Wa_wNIHQ&oe=6A07FC4C',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/488977714_1308339510739037_4006594291916193589_n.jpg?stp=c342.0.1365.1365a_dst-jpg_s206x206_tt6&_nc_cat=102&ccb=1-7&_nc_sid=a934a8&_nc_ohc=aIM3Bv0mdwIQ7kNvwHDHxl8&_nc_oc=Adpmp0pAV8dd9TUZ4yz9XL_edlsrKwYDg9lWLtzNRkhs-X0g0wCDE0An_J3R0_aSPGc&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=gD0bhcKeOJzKholPmBUOEA&_nc_ss=7b289&oh=00_Af6znu6eT-gikLfU6Dd7J8-623Pt7uXU8NyyZUFD6ZiTfg&oe=6A080A72',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/489110535_1308339657405689_1558066768429369335_n.jpg?stp=c342.0.1365.1365a_dst-jpg_s206x206_tt6&_nc_cat=107&ccb=1-7&_nc_sid=a934a8&_nc_ohc=WK9BLY-y-sYQ7kNvwHBT8RH&_nc_oc=AdolOtMbHCb_ZwJol4VZPMOy0AMuQ-YqdvyVxk9S8k1lQj9huJJrUtKJBE6ZePx8Gkk&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=kid3U_jypj_CaAHnKVspRQ&_nc_ss=7b289&oh=00_Af6Qaf6fkNiWeROo6OgXXfPeseQ1RkDAPYiXRHU5NIgcNA&oe=6A082257',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/488958805_1308339600739028_9130969183001980312_n.jpg?stp=c342.0.1365.1365a_dst-jpg_s206x206_tt6&_nc_cat=103&ccb=1-7&_nc_sid=a934a8&_nc_ohc=LP2Xs4WMoJQQ7kNvwHxk5hF&_nc_oc=AdqbFXby_TtxqI7D1bAjTpExzSqk-CGPEMhe-AtDJpd8vaI73GU_pYxJoSvs4tZJd68&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=kid3U_jypj_CaAHnKVspRQ&_nc_ss=7b289&oh=00_Af7rnKFu-abrGq4dzIhGAZ8MHI7QzwUTsdAq2VPlzmMHvA&oe=6A080886',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/488658629_1308339604072361_1773743819997213647_n.jpg?stp=c342.0.1365.1365a_dst-jpg_s206x206_tt6&_nc_cat=108&ccb=1-7&_nc_sid=a934a8&_nc_ohc=-YM-Oxm8PnwQ7kNvwFDRVPe&_nc_oc=Ado5r23E9mR9oTXmKoj3EZet1XwX7kEl9S_S_Z46Fs_DucHLJ2HCGiRx9X2W2e2eNV8&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=kid3U_jypj_CaAHnKVspRQ&_nc_ss=7b289&oh=00_Af7ncyV0sU_kLEeLruP6fY_FAaijoqYl6djX0memZQe1Hg&oe=6A081F51',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/489567274_1308339740739014_5197579257901171374_n.jpg?stp=c342.0.1365.1365a_dst-jpg_s206x206_tt6&_nc_cat=104&ccb=1-7&_nc_sid=a934a8&_nc_ohc=hNYnpW5xz4cQ7kNvwHNwm2b&_nc_oc=AdpZqgLVPAEFzvu12Ui24hBVVI0zPyU7AuPbPeyryIubQFkhPpWqkg0qLRyIKvRBRoY&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=kid3U_jypj_CaAHnKVspRQ&_nc_ss=7b289&oh=00_Af7nNhGOJ00OcYmJS-uO3nLeLrKqMa-i_YXJJkIX21tN7w&oe=6A07F9BB',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/488709753_1308339750739013_2721306050478597448_n.jpg?stp=c342.0.1365.1365a_dst-jpg_s206x206_tt6&_nc_cat=107&ccb=1-7&_nc_sid=a934a8&_nc_ohc=ppEJOydq-ZoQ7kNvwH052cZ&_nc_oc=Adrkc3xNqXgpwz9zojy8h7FiCCJxGoyLW28zF8M6LbkKNILFb7P6TbzheHTYFkL1XDY&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=kid3U_jypj_CaAHnKVspRQ&_nc_ss=7b289&oh=00_Af4hhfptSWEz2SJIs3XJwJUi5Z94Eiic4qgf0hoIS0DqUg&oe=6A0805C3',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/488741829_1308339507405704_5772362889763471595_n.jpg?stp=c342.0.1365.1365a_dst-jpg_s206x206_tt6&_nc_cat=104&ccb=1-7&_nc_sid=a934a8&_nc_ohc=_N9iaVGX7JAQ7kNvwGhoElw&_nc_oc=Adp0P4QmYMEZ4EyY5QgpLpKegiJoQRCXBAjEXx2P4LIn9brKKhnnD7QlAo8JeJnRqVU&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=kid3U_jypj_CaAHnKVspRQ&_nc_ss=7b289&oh=00_Af5RS2cdJmuUTh1gh_9QsTRzwYelRVymB10iKDYJ4Y5nlA&oe=6A0806ED',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/488885813_1308339460739042_5688713796690192284_n.jpg?stp=c342.0.1365.1365a_dst-jpg_s206x206_tt6&_nc_cat=110&ccb=1-7&_nc_sid=a934a8&_nc_ohc=tjPcAeES5UkQ7kNvwGSdj9t&_nc_oc=Adp9uczPVgyzgh1l2y971xfKlo-H52G-niVYIWFZaiaTcEEk9zSUiHsxwf7rAp4xlMc&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=kid3U_jypj_CaAHnKVspRQ&_nc_ss=7b289&oh=00_Af6O2Ey9UFtMgAZBRk9eTOhmgvntQ37XS2AwEWw4wQXohw&oe=6A080724',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/489043159_1308339614072360_8308880985299752319_n.jpg?stp=c342.0.1365.1365a_dst-jpg_s206x206_tt6&_nc_cat=110&ccb=1-7&_nc_sid=a934a8&_nc_ohc=S3QC_KzrVJIQ7kNvwF0unFo&_nc_oc=AdrcoT0WkmHQTvf_HFOgpijbcjlt6Av4zeRxf2dC-jecJ54km3ubCMl3-OnPkxdX6T4&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=kid3U_jypj_CaAHnKVspRQ&_nc_ss=7b289&oh=00_Af4J6MyrX_rXtGyWMdntHDVB5u4fAXCMARVs8tRNXADucg&oe=6A08107E',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  }
];

const facebookHighQualitySources = [
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/488546570_1310107267228928_4662144639266566876_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=110&ccb=1-7&_nc_sid=7b2446&_nc_ohc=QZxElpZx0KYQ7kNvwEsO_aw&_nc_oc=AdqsfeEUCxNMFiqc-X4DMJFD_qjbuIXNcpJrbRRgd5KIW8-fCuNN0ZK_OuA6Dw-sVlg&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=bK5yua4ZIhGdised9kLhtg&_nc_ss=7b289&oh=00_Af4lTlW5VRieMV9c6qX8QNiiZ-m4uZiX3nDi-sHhrlXbJw&oe=6A080C0E',
  'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/488566338_1310107223895599_303539282409666909_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=104&ccb=1-7&_nc_sid=7b2446&_nc_ohc=9y9Qrvp3FnwQ7kNvwFqSRgE&_nc_oc=AdqN2faVEXutbFl5I8_FEPjLs58ey9qc1rgFEoTxpiiDqDlHvTkRE5sB9jUZGqJxAo4&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=spyyqwgcvbm2Cp3VfrPa9A&_nc_ss=7b289&oh=00_Af6WHlR3hlB1ZOa9ciz2mb-6KBaVhMCq4QnrNOEzZ_gnLg&oe=6A0826BC',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/488571345_1308339584072363_5698708514327297594_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=13d280&_nc_ohc=-avPhO8IAyAQ7kNvwGrf8tc&_nc_oc=Ado4C0fIeCUeufUFBmcMSi_ceIB7zOInK1CfQbNVGYxiQRkK-FmIt7MOwRMUUVY6Yko&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=CiHPFHpSDXlT3UmsPwjspQ&_nc_ss=7b289&oh=00_Af4zpt9T2oQ-cVW58zrJIcJMx9Y7KYIkFz-W9vpdbLzSNw&oe=6A082A5F',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/488615640_1310107423895579_428050740681099241_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=102&ccb=1-7&_nc_sid=7b2446&_nc_ohc=qF_VAPSzA4gQ7kNvwFiKIvc&_nc_oc=AdqeZH0FZM8_Zpvchv4a58XvZ9SRi1uzVvaXfr9vooEw0yH_U8RPeV7m8p9ukchhKP4&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=J8CxCh9xYZ90qUENDsMl7w&_nc_ss=7b289&oh=00_Af5mt3KNBRthdze6FM1qQAjStKlkJzTELjrZe2Mxr8IWwA&oe=6A083625',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/488654961_1308339530739035_7323435807518980619_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=13d280&_nc_ohc=XWDAG748jE4Q7kNvwGZoxnJ&_nc_oc=AdoTiyY3IOMNsd-1fVtpLFWHT_EuxMHIweqQRNE_vUdA1pgikXYsk--xIJ3_K5B6rmA&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=SFkecLL6Z93-LRCbhGM49Q&_nc_ss=7b289&oh=00_Af65atNoPBpq11H9EuCELlJkbZw6iBQ7VtkLa8aFmOSDMg&oe=6A08348C',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/488658629_1308339604072361_1773743819997213647_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=13d280&_nc_ohc=2G6NE4ZBLw8Q7kNvwHUcEzF&_nc_oc=Adp2cwwc9XXhK30aoxDsnXAFbKq8dfzDsHmI_GdUViDjaWlGWd9B1hN5Xx-cQ_ao-18&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=v6If7rTxL_3LOreM6_qetw&_nc_ss=7b289&oh=00_Af6vXj3I9ufvhkJHfE4ZsaDE1m6ATeQbB3F6SyJqPabNIQ&oe=6A081F51',
  'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/488659282_1308339467405708_5434926097325623031_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=13d280&_nc_ohc=JhHn8odn-_8Q7kNvwHYpQUF&_nc_oc=AdqHPJnPRAIWPFo04UYWaM4Cqn85njhGXZOHPt2aN0mGR1UV2Qpps8jFH_miEoT0VIk&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=Lbd_vFTc1zpVmE68DfiKYQ&_nc_ss=7b289&oh=00_Af4RTs0DjJBOlPyXCCuqKhMLAPztKbx0MdgoSGTfwfpY9w&oe=6A080BB2',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/488709753_1308339750739013_2721306050478597448_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=13d280&_nc_ohc=ppEJOydq-ZoQ7kNvwH052cZ&_nc_oc=Adrkc3xNqXgpwz9zojy8h7FiCCJxGoyLW28zF8M6LbkKNILFb7P6TbzheHTYFkL1XDY&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=PM9xjomma6ZcqFib-QBBQw&_nc_ss=7b289&oh=00_Af4rdXkynTCwK0xgkUJSpNeJgWyFIN-knmOSRXMxu70U6A&oe=6A0805C3',
  'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/488741829_1308339507405704_5772362889763471595_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=13d280&_nc_ohc=_N9iaVGX7JAQ7kNvwGhoElw&_nc_oc=Adp0P4QmYMEZ4EyY5QgpLpKegiJoQRCXBAjEXx2P4LIn9brKKhnnD7QlAo8JeJnRqVU&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=lspVNc2824OdYYJpG2BJZg&_nc_ss=7b289&oh=00_Af7Wxmz9rrx-6LFeVp0iXNYe5j-0X2yx3g3c_LnTJ2VxPA&oe=6A0806ED',
  'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/488793005_1308339764072345_4753571484787772510_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=13d280&_nc_ohc=jyy6TI0Zn0EQ7kNvwFwYYsT&_nc_oc=Adr_m_O8pEhKtQlOfSw7r6_zci5Kqvpf2MQUidH0NpGQ5p1kvOitc_Wso3p9HzVCMhk&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=K4Qd9WR6o7Dliye5MGmDGA&_nc_ss=7b289&oh=00_Af4wWpDExjWx_bVfnZKXyzgnZK2IHTqy0YhMaKfeUze0_w&oe=6A081EAB',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/488885813_1308339460739042_5688713796690192284_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=13d280&_nc_ohc=tjPcAeES5UkQ7kNvwGSdj9t&_nc_oc=Adp9uczPVgyzgh1l2y971xfKlo-H52G-niVYIWFZaiaTcEEk9zSUiHsxwf7rAp4xlMc&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=zXfCAZbnkh_Abu4wIW2cFQ&_nc_ss=7b289&oh=00_Af7GHSoDLAhYhFveTdoJ4c7-SPMj2WsCLgEMMcJlBo3DjA&oe=6A080724',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/488958805_1308339600739028_9130969183001980312_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=13d280&_nc_ohc=LP2Xs4WMoJQQ7kNvwHxk5hF&_nc_oc=AdqbFXby_TtxqI7D1bAjTpExzSqk-CGPEMhe-AtDJpd8vaI73GU_pYxJoSvs4tZJd68&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=XP5vpsLbXT0759vEeeJMUw&_nc_ss=7b289&oh=00_Af57rhllFCNrSfhcL6yrTUl7b_qXHhG9uIMJd5Yw8A7kEw&oe=6A080886',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/488977714_1308339510739037_4006594291916193589_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=13d280&_nc_ohc=aIM3Bv0mdwIQ7kNvwHDHxl8&_nc_oc=Adpmp0pAV8dd9TUZ4yz9XL_edlsrKwYDg9lWLtzNRkhs-X0g0wCDE0An_J3R0_aSPGc&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=YraNs8G_RuFgii4uq_98Rw&_nc_ss=7b289&oh=00_Af4gcfP78o_5-_L2fTQtHybuUofOBVorudP59kdxjlgTNQ&oe=6A080A72',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/489027088_1310107000562288_5360028761265217842_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=103&ccb=1-7&_nc_sid=7b2446&_nc_ohc=olb5ne255_4Q7kNvwEVhjyT&_nc_oc=AdoC-zRGBWmFtXwgiwXSXduqNbONITRVNVGpwUV4Dr5aGvyQtAIfe7z7VBjTk36954Y&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=J_qOkSpgKlm8DhM6QJXLKg&_nc_ss=7b289&oh=00_Af43Arivzm7mmDjdY6168QU-Ms3JyXVnfc6kADHw2vQDyA&oe=6A082A18',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/489027217_1310107047228950_1149573966605870278_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=107&ccb=1-7&_nc_sid=7b2446&_nc_ohc=r_6FzKvA2NEQ7kNvwGAtR7L&_nc_oc=AdowO9qrO3svOlzb7KTFGBle9eDveFu0EOnz73sC0w3xXAZMxXg0rM740IV8WD2w4Es&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=RyhSldc8dtfEAIei7eeLmg&_nc_ss=7b289&oh=00_Af6hvDHBSQ4IdCBOPfUaL8g9HydV86m_C29R0_2ARQ7ZfA&oe=6A08072C',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/489043159_1308339614072360_8308880985299752319_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=13d280&_nc_ohc=S3QC_KzrVJIQ7kNvwF0unFo&_nc_oc=AdrcoT0WkmHQTvf_HFOgpijbcjlt6Av4zeRxf2dC-jecJ54km3ubCMl3-OnPkxdX6T4&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=0RacPoQCq4lWjt9Bm4SKPA&_nc_ss=7b289&oh=00_Af6UClAQoyk3PHsC4CAh5Z6wPQLUruTiDtOqHEHjWC0FhA&oe=6A08107E',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/489110535_1308339657405689_1558066768429369335_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=13d280&_nc_ohc=WK9BLY-y-sYQ7kNvwHBT8RH&_nc_oc=AdolOtMbHCb_ZwJol4VZPMOy0AMuQ-YqdvyVxk9S8k1lQj9huJJrUtKJBE6ZePx8Gkk&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=_ejqAKy-kSUWkW08RghJzA&_nc_ss=7b289&oh=00_Af5glzAms5FmaJxyNQMkSPAFEi9-uvZp5JY3YDeFG4iFww&oe=6A082257',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/489503393_1310107007228954_5696515006301429549_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=108&ccb=1-7&_nc_sid=7b2446&_nc_ohc=jfBftdpQzF4Q7kNvwEbMune&_nc_oc=AdobG7UGTS3Jb-EOXYkvIvwPrl8_6KcjYpMGRBCU4zFASWXGfx8QMf0cYlvIk89RWCY&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=p21bmvyj2qCOvK__sbyiwA&_nc_ss=7b289&oh=00_Af4e9P6MThzpDI1O1yH8hwtLm6iYIZjnlk0L-h3Ma8eULQ&oe=6A081F80',
  'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/489553677_1310107440562244_4634812104059425717_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=104&ccb=1-7&_nc_sid=7b2446&_nc_ohc=Ackahjp3bv4Q7kNvwFFYyLa&_nc_oc=Adq1UXLQ9DJe9VGkWdaYW3XZIQd6I38OKqfq4JkXPL0ZdBgMRs7wgRxOxkKxVhjw-14&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=GpsyyGQJHGNsNB_30mUI9w&_nc_ss=7b289&oh=00_Af6LJM9OyDq9pIfYDoTPd7WW5Z-KVUBFaOubI6l69zVvvw&oe=6A08366C',
  'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/489567274_1308339740739014_5197579257901171374_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=13d280&_nc_ohc=hNYnpW5xz4cQ7kNvwHNwm2b&_nc_oc=AdpZqgLVPAEFzvu12Ui24hBVVI0zPyU7AuPbPeyryIubQFkhPpWqkg0qLRyIKvRBRoY&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=VYn8pQ5YiOyWHVh_Ee2Q3w&_nc_ss=7b289&oh=00_Af4rgBEVb1skty1m9syKVooeFt44GuLO-dYSSxnC3cGDlQ&oe=6A0831FB',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/491445977_1322662272640094_1731749990350305946_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=7b2446&_nc_ohc=amznXrsC5cgQ7kNvwHLTnI9&_nc_oc=Adpz3h-DXTs0iH8tElJ06YczvLLsubwuusiUCOk-qXNo5oQl0vOXgQqc5U0DSfMh2XY&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=5DFREDTaYZGPpW0Hli63Xg&_nc_ss=7b289&oh=00_Af58Lq_fTrIplwofJi7E0abxjmddzHdACHHmqqDINQhyig&oe=6A081C40',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/491840374_1322662695973385_6246702159607105157_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=7b2446&_nc_ohc=QOp5F6oXlOUQ7kNvwGegJ_a&_nc_oc=Ado85DkO7xvFD3pyQRXTKdAITs0InBi982D0B8ql8wlcy-BZn-mtvjb0lXh_VyYlPhc&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=letD7P6gmif4x6LdSlPYIw&_nc_ss=7b289&oh=00_Af76Ck_bzdT6DeQ7_x1qpmbz8KpCwyz6ofU3Im29m-b8Lg&oe=6A081B7C',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/493982209_1328772302029091_374628181166287241_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=7b2446&_nc_ohc=lcoBvUVXg9UQ7kNvwFeZn0i&_nc_oc=AdqRM0TJW_IsFZsO_XbrTX-1CWXO-EWLD-IeKTz22J-B4ZTH_aSG9HEo-CiLaBNmzTI&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=1wscT5jpYQbqfJRAaklm5A&_nc_ss=7b289&oh=00_Af4RzifE-Jj99zyLy6tQyr-gqz3tt1pb1jqVvuIMWUWzpA&oe=6A082138',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/493993822_1328773985362256_3554910033961218563_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=7b2446&_nc_ohc=1Nfv8i0Nwj8Q7kNvwEgjGQz&_nc_oc=Adq4-jHtlJvv1P1pvCvbfTYwPYfOntDdYF9FCdzOmU-2t1zbm4PKCq9Xiy3tWl2dGmc&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=Pdy9on2Nk3dbR8y_-P-Erw&_nc_ss=7b289&oh=00_Af5oQqriqLz2NNyUzcNJmX0cFFYgfL4vgT6kxd-Ns3GSpg&oe=6A08336D',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/520293361_1396853558554298_776466652404772281_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=7b2446&_nc_ohc=p8xMBImG9P0Q7kNvwHObcVh&_nc_oc=Adq703owLkULvbWMFgF4WdY47TOTpQUJtr20aVnb-EJ5BQhd36k9LRUmR4N_KlQ3wj8&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=1NyTHPiiD3FoZyyEA_KfkQ&_nc_ss=7b289&oh=00_Af4Qgj5K5kSQnxYHw92_LrIj5-i3ZqCcLVVMjKqOlF0bqA&oe=6A08032E',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/547455296_1448003500105970_3265662309900955788_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=7b2446&_nc_ohc=--coMsViPV0Q7kNvwHYGCe6&_nc_oc=AdrM7ErdTCmWlLIlH6BNtAlcuwyrLCH9lbl7EF7Y5cQIyuE1FQEY20MhLit3R7ryzsE&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=-RIpu6UNJP_L_Vvy4eRvUQ&_nc_ss=7b289&oh=00_Af76n078Lf50lp2OrSCg5IM0QWUV9NMSIFhDv6cER0KgEA&oe=6A0808B8',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/547646100_1448003506772636_2683809327190524157_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=7b2446&_nc_ohc=4PzIIULe8AQQ7kNvwGBOviB&_nc_oc=AdoBGLfx8ORWHK5S48xM4M6_XMVKlmTT06SdUaB0peNUEBkAARVcnbz4hviRRDKxy_c&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=Wwdq-VlOwx5asN7GyAVyUA&_nc_ss=7b289&oh=00_Af63fPVnFipy4wAoj40YsQKWdJjAj6OhuQuvPU2z1Fgjmg&oe=6A081E67',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/548723599_1448003550105965_2989915834329744314_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=108&ccb=1-7&_nc_sid=7b2446&_nc_ohc=MQQ7Y8UIn6cQ7kNvwGFe6zA&_nc_oc=AdqIuUCvreqS_nZ1Y3IxPyGddfXETZPyMa4VVU9a6hxj1C4Kwk1o6UBp3V0w3y8-5dw&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=cQVuO9n3dvkIy4T-aVMGrg&_nc_ss=7b289&oh=00_Af5iz83WZOAYg9RlZKaHPhnwZbQ2ylungla-1VYF_voWwg&oe=6A081443',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/549715556_1448003536772633_4648318552302692281_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=110&ccb=1-7&_nc_sid=7b2446&_nc_ohc=1zx0SHMnaHAQ7kNvwEfjHyt&_nc_oc=AdqY67gtvMXMd5Xp_y2YusdDgNHbhnXF74YIt9SPDblbJQaQ5oJMXB3C4lRvwT1YSYI&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=hTkX5-_6fAe5z-rNqMg-Aw&_nc_ss=7b289&oh=00_Af4eNwziqYgpzpmJExohT5ZuqLkEXIraR0NHyN8HaZJ20g&oe=6A0800FC',
  'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/573374469_1493127725593547_5547752852223608786_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=7b2446&_nc_ohc=E80XUI34XBgQ7kNvwHomNbr&_nc_oc=AdqP6Ys04WIf7auSNA6RrWSRSP-q8dQ_3DsfBBxOFLewgA03QEbUdDpHR7YYaKyzFxU&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=LgaY1fgTf8b6pPxji7ABPw&_nc_ss=7b289&oh=00_Af509DkevNWtNbDNZROwHinr_got_RmzuSZH0bzSOv57Kg&oe=6A07FF4A',
  'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/573891801_1493128602260126_3070074279857641340_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=7b2446&_nc_ohc=V0sg0KEHtkMQ7kNvwGp9jLL&_nc_oc=Adq9Kxze8BQg4cyfgal0fQA7CCvTgwyD8LXPBiLHB8bG0I7j59j0aly6O0Kaa0Vpbj8&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=xP9qGHjjfWs6Knmx0DVJ1A&_nc_ss=7b289&oh=00_Af6krJdCS9jMFdVYckMPdFSadtiHCLF-x7iz9iYGMHJN6w&oe=6A080FA1',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/573923631_1493128558926797_956038550251571563_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=7b2446&_nc_ohc=RDxdHpZ3H2oQ7kNvwFZQYV_&_nc_oc=AdpLyDOYSCiTDrrWPeWbZjPEa5DrOKv0P-e2qOxSpQOFzk4Z_-2kdJ8tVCd72NdGpEg&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=L4InnL2bLwrei7FPnSZ0ug&_nc_ss=7b289&oh=00_Af4FTezwy_MHMpyWdYW9df_jzlj7q7OtP47uwkNFR1h2WQ&oe=6A08326A',
  'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/574034432_1493128632260123_628460640214557466_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=7b2446&_nc_ohc=kOq_sVn1SxkQ7kNvwHthGr2&_nc_oc=Adp71Hgw2Vj_Cl_AwY9kiOT-5B1neOGyB3RkGJecW57Ry4MoqgaZeusXepwuU4mccxs&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=YlrkbnKpKBLOBw-QmatLyg&_nc_ss=7b289&oh=00_Af61NeObRKLfFeYziuiuskhlu5-1Y3Q9ppILLEVaGQLdFA&oe=6A07FFC2',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/574390030_1493128615593458_7589757113301233912_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=7b2446&_nc_ohc=ZwoZNMuZ1I4Q7kNvwFbCWER&_nc_oc=AdpPHgE9PoqdPRQxfoMcEp6mcAs7Fq57h5dYXMeVCu3OpSu9lJPKQalsLMNeIKDhrpc&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=cM9W4YJgGvu-jAqcKfXI1A&_nc_ss=7b289&oh=00_Af738og5JbEtRtHSoTM3PKQi7EHMvrDfA3Frh52YVSICUQ&oe=6A07FF8E',
  'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/576469767_1493128565593463_8311896667144904990_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=7b2446&_nc_ohc=J5tQRiuUE_IQ7kNvwHjr0sz&_nc_oc=AdoffP_fFJgM_W3och8QHosk7BgYUemSCft5hbZZE6AdZcj__RHEJLPiyy9Rt4qFbDg&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=QjPIC3_K6Z3iiAPxSRcaXg&_nc_ss=7b289&oh=00_Af7MegDS3W4gAY0hFLXAL6Jm3U_kpvYKRphmB_3i0nUKLA&oe=6A083409',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/607950584_1545940523645600_7370249189459747437_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=7b2446&_nc_ohc=d6r2XKgz5rMQ7kNvwGk8-1y&_nc_oc=AdpjDo1UMJrXMBi-tKlU_OtK1_fCpjbvGEBcM2KS1cIApzUh5i4V67NqbbRV3odCBFo&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=Uz_X43DecdlXOyMX0Xq84A&_nc_ss=7b289&oh=00_Af4netuu85tdQZH52gNu1aBrQH7wXkTb9XKrwtEdTARIYA&oe=6A080B06',
  'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/672643464_1637213431184975_1515063720095141462_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=101&ccb=1-7&_nc_sid=7b2446&_nc_ohc=S5ej16cRdd0Q7kNvwF7nFKF&_nc_oc=AdpjQp1ODCxCeNe92ZhbUFlVilB6RylOAk2SWSQ-T3bkqQkMIy-NId9NHxc16VLAn7o&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=TboTkqnPSF41VAqqx4yePQ&_nc_ss=7b289&oh=00_Af4T2mbvyJdh5qPv3go1_E4OEYkrW8_zKVS6FyfRrafiKA&oe=6A0804D3',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/672683099_1637213437851641_7228904326571331058_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=7b2446&_nc_ohc=DijEINDBPKEQ7kNvwFzFeHh&_nc_oc=AdpoDMg1Vg_eVVf7-HZq7koRuc3WnMAsWU4esNWoUT0bGDn6np5eB3uww4midIJQzdw&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=ok7IrXTzuVg_zKvfzEeVwA&_nc_ss=7b289&oh=00_Af6W_OZxjC49vMmOoeNhiBLbTvA6coak-cJCQwTz-4ZJpw&oe=6A083671',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/673535871_1637213414518310_7903495935145392462_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=7b2446&_nc_ohc=RhRRNJswA_cQ7kNvwEt9qUa&_nc_oc=AdpmouZtIJ5_2j_kpq8UyejV_hi3o75kUpSVoztm0dWCX5rX95X_ua2d2cg1uc5Z3ns&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=CsWt0wV8as3AWsFP-L82qw&_nc_ss=7b289&oh=00_Af7AQy8rvg7Ob3S-ktV7a98LdyrnQ2xcqBTlGSamyYMExw&oe=6A082523',
  'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/673625921_1637213444518307_5611692299590495681_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=107&ccb=1-7&_nc_sid=7b2446&_nc_ohc=XMCWLhA7ivMQ7kNvwF6Gpzm&_nc_oc=AdrVVEfwaswkK9-vdH-3nm3ubNRZFok2XB_UpDP1rUBH1083_RK93o1YBkqy-L0e_8Y&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=WmYr-yajXIoEGqkOoYd9XQ&_nc_ss=7b289&oh=00_Af6CO5N7kkGsNIOXIZ9M-IypNSznR8WEKjLDtEtsd1DwaA&oe=6A082F6F'
];

const facebookHighQualityByFile = facebookHighQualitySources.reduce((map, url) => {
  try {
    const filename = new URL(url).pathname.split('/').pop();
    if (filename) {
      map[filename] = url;
    }
  } catch {
    // Ignore invalid URL entries.
  }

  return map;
}, {});

const facebookPostByFile = {
  '673625921_1637213444518307_5611692299590495681_n.jpg': 'https://www.facebook.com/photo.php?fbid=1637213154518336&set=pb.100046890018721.-2207520000&type=3',
  '672683099_1637213437851641_7228904326571331058_n.jpg': 'https://www.facebook.com/photo.php?fbid=1637213121185006&set=pb.100046890018721.-2207520000&type=3',
  '673535871_1637213414518310_7903495935145392462_n.jpg': 'https://www.facebook.com/photo.php?fbid=1637213097851675&set=pb.100046890018721.-2207520000&type=3',
  '672643464_1637213431184975_1515063720095141462_n.jpg': 'https://www.facebook.com/photo.php?fbid=1637213077851677&set=pb.100046890018721.-2207520000&type=3',
  '607950584_1545940523645600_7370249189459747437_n.jpg': 'https://www.facebook.com/photo.php?fbid=1545940516978934&set=pb.100046890018721.-2207520000&type=3',
  '574390030_1493128615593458_7589757113301233912_n.jpg': 'https://www.facebook.com/photo.php?fbid=1493127775593542&set=pb.100046890018721.-2207520000&type=3',
  '573891801_1493128602260126_3070074279857641340_n.jpg': 'https://www.facebook.com/photo.php?fbid=1493127762260210&set=pb.100046890018721.-2207520000&type=3',
  '574034432_1493128632260123_628460640214557466_n.jpg': 'https://www.facebook.com/photo.php?fbid=1493127722260214&set=pb.100046890018721.-2207520000&type=3',
  '573374469_1493127725593547_5547752852223608786_n.jpg': 'https://www.facebook.com/photo.php?fbid=1493127715593548&set=pb.100046890018721.-2207520000&type=3',
  '576469767_1493128565593463_8311896667144904990_n.jpg': 'https://www.facebook.com/photo.php?fbid=1493127675593552&set=pb.100046890018721.-2207520000&type=3',
  '573923631_1493128558926797_956038550251571563_n.jpg': 'https://www.facebook.com/photo.php?fbid=1493127662260220&set=pb.100046890018721.-2207520000&type=3',
  '549715556_1448003536772633_4648318552302692281_n.jpg': 'https://www.facebook.com/photo.php?fbid=1448002896772697&set=pb.100046890018721.-2207520000&type=3',
  '548723599_1448003550105965_2989915834329744314_n.jpg': 'https://www.facebook.com/photo.php?fbid=1447998550106465&set=pb.100046890018721.-2207520000&type=3',
  '547646100_1448003506772636_2683809327190524157_n.jpg': 'https://www.facebook.com/photo.php?fbid=1447998510106469&set=pb.100046890018721.-2207520000&type=3',
  '547455296_1448003500105970_3265662309900955788_n.jpg': 'https://www.facebook.com/photo.php?fbid=1447998496773137&set=pb.100046890018721.-2207520000&type=3',
  '520293361_1396853558554298_776466652404772281_n.jpg': 'https://www.facebook.com/photo.php?fbid=1396853555220965&set=pb.100046890018721.-2207520000&type=3',
  '493982209_1328772302029091_374628181166287241_n.jpg': 'https://www.facebook.com/photo.php?fbid=1302141158025539&set=pb.100046890018721.-2207520000&type=3',
  '493993822_1328773985362256_3554910033961218563_n.jpg': 'https://www.facebook.com/photo.php?fbid=1302141141358874&set=pb.100046890018721.-2207520000&type=3',
  '491840374_1322662695973385_6246702159607105157_n.jpg': 'https://www.facebook.com/photo.php?fbid=1295398278699827&set=pb.100046890018721.-2207520000&type=3',
  '491445977_1322662272640094_1731749990350305946_n.jpg': 'https://www.facebook.com/photo.php?fbid=1295398262033162&set=pb.100046890018721.-2207520000&type=3',
  '489553677_1310107440562244_4634812104059425717_n.jpg': 'https://www.facebook.com/photo.php?fbid=1145609870345336&set=pb.100046890018721.-2207520000&type=3',
  '488566338_1310107223895599_303539282409666909_n.jpg': 'https://www.facebook.com/photo.php?fbid=1145609830345340&set=pb.100046890018721.-2207520000&type=3',
  '488615640_1310107423895579_428050740681099241_n.jpg': 'https://www.facebook.com/photo.php?fbid=1145609813678675&set=pb.100046890018721.-2207520000&type=3',
  '489503393_1310107007228954_5696515006301429549_n.jpg': 'https://www.facebook.com/photo.php?fbid=1145609763678680&set=pb.100046890018721.-2207520000&type=3',
  '489027217_1310107047228950_1149573966605870278_n.jpg': 'https://www.facebook.com/photo.php?fbid=1145609750345348&set=pb.100046890018721.-2207520000&type=3',
  '489027088_1310107000562288_5360028761265217842_n.jpg': 'https://www.facebook.com/photo.php?fbid=1145609713678685&set=pb.100046890018721.-2207520000&type=3',
  '488546570_1310107267228928_4662144639266566876_n.jpg': 'https://www.facebook.com/photo.php?fbid=1145609697012020&set=pb.100046890018721.-2207520000&type=3',
  '488571345_1308339584072363_5698708514327297594_n.jpg': 'https://www.facebook.com/photo.php?fbid=1092085229031134&set=pb.100046890018721.-2207520000&type=3',
  '488659282_1308339467405708_5434926097325623031_n.jpg': 'https://www.facebook.com/photo.php?fbid=1092085152364475&set=pb.100046890018721.-2207520000&type=3',
  '488793005_1308339764072345_4753571484787772510_n.jpg': 'https://www.facebook.com/photo.php?fbid=1092085145697809&set=pb.100046890018721.-2207520000&type=3',
  '488654961_1308339530739035_7323435807518980619_n.jpg': 'https://www.facebook.com/photo.php?fbid=1092085122364478&set=pb.100046890018721.-2207520000&type=3',
  '488977714_1308339510739037_4006594291916193589_n.jpg': 'https://www.facebook.com/photo.php?fbid=1092085099031147&set=pb.100046890018721.-2207520000&type=3',
  '489110535_1308339657405689_1558066768429369335_n.jpg': 'https://www.facebook.com/photo.php?fbid=1092085075697816&set=pb.100046890018721.-2207520000&type=3',
  '488958805_1308339600739028_9130969183001980312_n.jpg': 'https://www.facebook.com/photo.php?fbid=1092085025697821&set=pb.100046890018721.-2207520000&type=3',
  '488658629_1308339604072361_1773743819997213647_n.jpg': 'https://www.facebook.com/photo.php?fbid=1092084995697824&set=pb.100046890018721.-2207520000&type=3',
  '489567274_1308339740739014_5197579257901171374_n.jpg': 'https://www.facebook.com/photo.php?fbid=1092084932364497&set=pb.100046890018721.-2207520000&type=3',
  '488709753_1308339750739013_2721306050478597448_n.jpg': 'https://www.facebook.com/photo.php?fbid=1092084909031166&set=pb.100046890018721.-2207520000&type=3',
  '488741829_1308339507405704_5772362889763471595_n.jpg': 'https://www.facebook.com/photo.php?fbid=1092084895697834&set=pb.100046890018721.-2207520000&type=3',
  '488885813_1308339460739042_5688713796690192284_n.jpg': 'https://www.facebook.com/photo.php?fbid=1092084875697836&set=pb.100046890018721.-2207520000&type=3',
  '489043159_1308339614072360_8308880985299752319_n.jpg': 'https://www.facebook.com/photo.php?fbid=1092084852364505&set=pb.100046890018721.-2207520000&type=3'
};

function shuffle(array) {
  const clone = [...array];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[randomIndex]] = [clone[randomIndex], clone[index]];
  }
  return clone;
}

function formatLongDate(value) {
  if (!value) {
    return 'Date unavailable';
  }

  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

function getPhotoPostText(photo, index) {
  if (photo.postText) {
    return photo.postText;
  }

  if (photo.alt) {
    return photo.alt;
  }

  return `Facebook archive photo ${index + 1}`;
}

function getPhotoPostUrl(photo) {
  try {
    const filename = new URL(photo.src).pathname.split('/').pop();
    if (filename && facebookPostByFile[filename]) {
      return facebookPostByFile[filename];
    }
  } catch {
    // ignore URL parse failures
  }

  return 'https://www.facebook.com/nomadcyclingclub/photos';
}

function getFacebookSourceCandidates(url) {
  try {
    const parsed = new URL(url);
    const stp = parsed.searchParams.get('stp');
    const candidates = [];

    if (stp && /s\d+x\d+/i.test(stp)) {
      const sizeSteps = ['s2048x2048', 's1536x1536', 's1080x1080', 's960x960', 's720x720'];
      for (const sizeStep of sizeSteps) {
        const candidate = new URL(url);
        candidate.searchParams.set('stp', stp.replace(/s\d+x\d+/i, sizeStep));
        candidates.push(candidate.toString());
      }

      // Some URLs permit removal of stp for original quality; keep as optional candidate.
      const noStp = new URL(url);
      noStp.searchParams.delete('stp');
      candidates.push(noStp.toString());
    }

    candidates.push(parsed.toString());
    return [...new Set(candidates)];
  } catch {
    return [url];
  }
}

function loadImageDimensions(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timer = setTimeout(() => {
      reject(new Error('Image load timeout'));
    }, 5000);

    image.onload = () => {
      clearTimeout(timer);
      resolve({ url, width: image.naturalWidth, height: image.naturalHeight });
    };

    image.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Image load error'));
    };

    image.src = url;
  });
}

let galleryPhotosForView = [];
let activePhotoIndex = 0;
let lightboxRequestId = 0;
let displayPhotosPromise = null;

function isSquareAspect(width, height) {
  if (!width || !height) {
    return true;
  }

  const ratio = width / height;
  return Math.abs(ratio - 1) <= 0.08;
}

async function resolveDisplayPhoto(photo) {
  let mappedFullSrc = null;
  try {
    const filename = new URL(photo.src).pathname.split('/').pop();
    mappedFullSrc = filename ? facebookHighQualityByFile[filename] : null;
  } catch {
    mappedFullSrc = null;
  }

  const rawCandidates = photo.fullSrc
    ? [photo.fullSrc, ...getFacebookSourceCandidates(photo.src)]
    : getFacebookSourceCandidates(photo.src);
  const candidates = [...new Set(mappedFullSrc ? [mappedFullSrc, ...rawCandidates] : rawCandidates)];

  for (const candidate of candidates) {
    try {
      const loaded = await loadImageDimensions(candidate);
      if (isSquareAspect(loaded.width, loaded.height)) {
        continue;
      }

      return {
        ...photo,
        bestSrc: loaded.url,
        width: loaded.width,
        height: loaded.height,
        candidateSrcs: [loaded.url, ...candidates.filter((item) => item !== loaded.url)]
      };
    } catch {
      // Try the next source candidate.
    }
  }

  return null;
}

async function getDisplayPhotos() {
  if (!displayPhotosPromise) {
    displayPhotosPromise = Promise.all(facebookPhotos.map((photo) => resolveDisplayPhoto(photo)))
      .then((photos) => photos.filter(Boolean));
  }

  return displayPhotosPromise;
}

async function setBestLightboxImage(photo, image, requestId) {
  const candidates = photo.candidateSrcs || [photo.src];
  let bestCandidate = null;

  for (const candidate of candidates) {
    try {
      const loaded = await loadImageDimensions(candidate);
      if (requestId !== lightboxRequestId) {
        return;
      }

      if (loaded.width > 0 && loaded.height > 0) {
        const loadedArea = loaded.width * loaded.height;
        const bestArea = bestCandidate ? bestCandidate.width * bestCandidate.height : 0;
        if (loadedArea > bestArea) {
          bestCandidate = loaded;
        }
      }
    } catch {
      // Try the next candidate URL.
    }
  }

  if (requestId === lightboxRequestId) {
    image.src = bestCandidate ? bestCandidate.url : photo.src;
  }
}

function updateLightboxPhoto(index) {
  const lightbox = document.getElementById('galleryLightbox');
  const image = document.getElementById('lightboxImage');
  const title = document.getElementById('lightboxTitle');
  const meta = document.getElementById('lightboxMeta');

  if (!lightbox || !image || !title || !meta || galleryPhotosForView.length === 0) {
    return;
  }

  const total = galleryPhotosForView.length;
  activePhotoIndex = (index + total) % total;
  const photo = galleryPhotosForView[activePhotoIndex];
  const requestId = ++lightboxRequestId;

  image.src = photo.src;
  image.alt = photo.alt || 'Club gallery photo';
  title.textContent = photo.title || `Photo ${activePhotoIndex + 1}`;
  meta.textContent = `${formatLongDate(photo.date)} • ${getPhotoPostText(photo, activePhotoIndex)} • ${activePhotoIndex + 1} / ${total}`;

  setBestLightboxImage(photo, image, requestId);
}

function openLightbox(index) {
  const lightbox = document.getElementById('galleryLightbox');
  if (!lightbox || galleryPhotosForView.length === 0) {
    return;
  }

  updateLightboxPhoto(index);
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lightbox-open');
}

function closeLightbox() {
  const lightbox = document.getElementById('galleryLightbox');
  if (!lightbox) {
    return;
  }

  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('lightbox-open');
}

function ensureGalleryLightbox() {
  let lightbox = document.getElementById('galleryLightbox');
  if (!lightbox) {
    const markup = `
      <div class="gallery-lightbox" id="galleryLightbox" aria-hidden="true" role="dialog" aria-label="Gallery photo viewer">
        <button class="lightbox-close" id="lightboxClose" aria-label="Close photo viewer">&times;</button>
        <button class="lightbox-nav prev" id="lightboxPrev" aria-label="Previous photo">&#10094;</button>
        <figure class="lightbox-figure">
          <img id="lightboxImage" src="" alt="" />
          <figcaption class="lightbox-caption">
            <strong id="lightboxTitle"></strong>
            <p id="lightboxMeta"></p>
          </figcaption>
        </figure>
        <button class="lightbox-nav next" id="lightboxNext" aria-label="Next photo">&#10095;</button>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', markup);
    lightbox = document.getElementById('galleryLightbox');
  }

  return {
    lightbox,
    closeButton: document.getElementById('lightboxClose'),
    previousButton: document.getElementById('lightboxPrev'),
    nextButton: document.getElementById('lightboxNext')
  };
}

function setupGalleryLightbox() {
  const gallery = document.getElementById('randomGallery');
  const lightboxParts = ensureGalleryLightbox();
  const lightbox = lightboxParts?.lightbox;
  const closeButton = lightboxParts?.closeButton;
  const previousButton = lightboxParts?.previousButton;
  const nextButton = lightboxParts?.nextButton;

  if (!gallery || !lightbox) {
    return;
  }

  const triggers = gallery.querySelectorAll('.gallery-trigger');
  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const index = Number(trigger.getAttribute('data-photo-index'));
      if (Number.isNaN(index)) {
        return;
      }
      openLightbox(index);
    });

    trigger.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }
      event.preventDefault();
      const index = Number(trigger.getAttribute('data-photo-index'));
      if (Number.isNaN(index)) {
        return;
      }
      openLightbox(index);
    });
  });

  closeButton?.addEventListener('click', closeLightbox);
  previousButton?.addEventListener('click', () => updateLightboxPhoto(activePhotoIndex - 1));
  nextButton?.addEventListener('click', () => updateLightboxPhoto(activePhotoIndex + 1));

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('open')) {
      return;
    }

    if (event.key === 'Escape') {
      closeLightbox();
      return;
    }

    if (event.key === 'ArrowLeft') {
      updateLightboxPhoto(activePhotoIndex - 1);
      return;
    }

    if (event.key === 'ArrowRight') {
      updateLightboxPhoto(activePhotoIndex + 1);
    }
  });
}

function setupGalleryCaptionToggles(gallery) {
  if (!gallery) {
    return;
  }

  const toggles = gallery.querySelectorAll('.gallery-caption-toggle');
  toggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const caption = toggle.closest('.gallery-media-caption');
      if (!caption) {
        return;
      }

      const isExpanded = caption.classList.toggle('is-expanded');
      caption.classList.toggle('is-clamped', !isExpanded);
      toggle.textContent = isExpanded ? 'Less' : 'More';
      toggle.setAttribute('aria-expanded', String(isExpanded));
    });
  });
}

async function renderGallery() {
  const gallery = document.getElementById('randomGallery');
  if (!gallery) {
    return;
  }

  const apiPosts = await fetchApiFeedPosts();
  const postsWithMedia = apiPosts.filter((post) => Array.isArray(post.media) && post.media.length > 0);

  if (postsWithMedia.length > 0) {
    gallery.classList.add('gallery-grid', 'gallery-grid-large');
    gallery.classList.remove('gallery-feed-grid');

    const seenImages = new Set();
    const seenVideos = new Set();
    const seenVideoPosters = new Set();
    const lightboxPhotos = [];
    const tiles = [];

    postsWithMedia.forEach((post, postIndex) => {
      const postUrl = post.permalinkUrl || post.permalink_url || 'https://www.facebook.com/nomadcyclingclub';
      const message = post.message || post.story || `Facebook post ${postIndex + 1}`;
      const postedAt = formatDateTime(post.createdTime || post.created_time);

      const normalizedMedia = post.media
        .map((media) => ({
          type: String(media.type || '').toLowerCase(),
          imageUrl: media.imageUrl || media.image_url || media.previewUrl || media.preview_url || '',
          videoUrl: media.videoUrl || media.video_url || media.sourceUrl || media.source_url || '',
          targetUrl: media.targetUrl || media.target_url || ''
        }))
        .filter((media) => media.imageUrl || media.videoUrl);

      const seenPostMedia = new Set();
      const postVideoPosters = new Set();
      const dedupedMedia = [];

      for (const media of normalizedMedia) {
        const videoKey = `video:${media.videoUrl}`;
        const imageId = extractImageId(media.imageUrl);
        const imageKey = `image:${imageId}`;

        if (media.type === 'video' && media.videoUrl) {
          if (!seenPostMedia.has(videoKey)) {
            dedupedMedia.push(media);
            seenPostMedia.add(videoKey);
            if (imageId) {
              postVideoPosters.add(imageId);
            }
          }
        } else if (imageId && !seenPostMedia.has(imageKey) && !postVideoPosters.has(imageId)) {
          dedupedMedia.push(media);
          seenPostMedia.add(imageKey);
        }
      }

      const hasVideo = dedupedMedia.some((media) => media.type === 'video' && media.videoUrl);
      const finalDisplayMedia = hasVideo
        ? dedupedMedia.filter((media) => media.type === 'video' && media.videoUrl)
        : dedupedMedia.filter((media) => media.type === 'photo' || media.type === 'video');

      finalDisplayMedia.forEach((media, mediaIndex) => {
        const mediaAlt = escapeHtml(message || `Gallery media ${mediaIndex + 1}`);
        const imageId = extractImageId(media.imageUrl);
        const isReel = /\/reel\//i.test(postUrl) || /reel/i.test(media.type) || /\/reel\//i.test(media.targetUrl || '');

        if (media.type === 'video' && media.videoUrl) {
          const videoKey = `video:${media.videoUrl}`;
          if (seenVideos.has(videoKey)) {
            return;
          }

          seenVideos.add(videoKey);
          if (imageId) {
            seenVideoPosters.add(imageId);
          }

          tiles.push(`
            <article class="gallery-card gallery-card-video">
              <div class="gallery-post-video${isReel ? ' gallery-post-video-reel' : ''}">
                <video controls preload="metadata" playsinline ${media.imageUrl ? `poster="${escapeHtml(media.imageUrl)}"` : ''}>
                  <source src="${escapeHtml(media.videoUrl)}" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div class="gallery-card-copy">
                <p>${escapeHtml(postedAt)}</p>
                <p class="gallery-caption-note"><a class="home-feed-text-link" href="${escapeHtml(postUrl)}" target="_blank" rel="noreferrer">Open post</a></p>
              </div>
            </article>
          `);
          return;
        }

        if (!media.imageUrl || !imageId || seenImages.has(imageId) || seenVideoPosters.has(imageId)) {
          return;
        }

        seenImages.add(imageId);
        const lightboxIndex = lightboxPhotos.length;
        lightboxPhotos.push({
          src: media.imageUrl,
          bestSrc: media.imageUrl,
          alt: message || `Facebook media ${lightboxIndex + 1}`,
          title: 'Facebook post',
          date: (post.createdTime || post.created_time || '').slice(0, 10) || null,
          postText: message,
          candidateSrcs: [media.imageUrl]
        });

        tiles.push(`
          <article class="gallery-card">
            <button class="gallery-trigger" type="button" data-photo-index="${lightboxIndex}" aria-label="Open photo ${lightboxIndex + 1}">
              <img src="${escapeHtml(media.imageUrl)}" alt="${mediaAlt}" loading="lazy" />
            </button>
            <div class="gallery-card-copy">
              <p>${escapeHtml(postedAt)}</p>
              <p class="gallery-caption-note"><a class="home-feed-text-link" href="${escapeHtml(postUrl)}" target="_blank" rel="noreferrer">Open post</a></p>
            </div>
          </article>
        `);
      });
    });

    galleryPhotosForView = lightboxPhotos;
    gallery.innerHTML = tiles.join('');
    if (!tiles.length) {
      gallery.innerHTML = '<p class="gallery-note">No Facebook media is currently available.</p>';
    }

    setupGalleryLightbox();
    return;
  }

  gallery.classList.add('gallery-grid', 'gallery-grid-large');
  gallery.classList.remove('gallery-feed-grid');

  const displayPhotos = await getDisplayPhotos();
  if (displayPhotos.length === 0) {
    gallery.innerHTML = '<p class="gallery-note">No Facebook media is currently available.</p>';
    return;
  }

  galleryPhotosForView = shuffle(displayPhotos).map((photo) => ({
    ...photo,
    candidateSrcs: photo.candidateSrcs || getFacebookSourceCandidates(photo.src)
  }));
  gallery.innerHTML = galleryPhotosForView.map((photo, index) => `
    <article class="gallery-card">
      <button class="gallery-trigger" type="button" data-photo-index="${index}" aria-label="Open photo ${index + 1}">
        <img src="${photo.bestSrc || photo.src}" alt="${photo.alt}" loading="lazy" />
      </button>
      <div class="gallery-card-copy">
        <h3>${photo.title || `Photo ${index + 1}`}</h3>
        <p>${formatLongDate(photo.date)}</p>
        <p class="gallery-caption-note">${getPhotoPostText(photo, index)}</p>
      </div>
    </article>
  `).join('');

  setupGalleryLightbox();
}

async function renderHomePreview() {
  const preview = document.getElementById('homePhotoPreview');
  if (!preview) {
    return;
  }

  const displayPhotos = await getDisplayPhotos();
  const randomizedPhotos = shuffle(displayPhotos).slice(0, 4);
  preview.innerHTML = randomizedPhotos.map((photo) => `
    <img src="${photo.bestSrc || photo.src}" alt="${photo.alt}" loading="lazy" />
  `).join('');
}

async function renderOnThisDay() {
  const section = document.getElementById('onThisDaySection');
  const label = document.getElementById('onThisDayLabel');
  if (!section) {
    return;
  }

  const today = new Date();
  const memoryDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric'
  }).format(today);

  if (label) {
    label.textContent = `On this day · ${memoryDate}`;
  }

  const apiPosts = await fetchApiFeedPosts();
  const currentYear = today.getFullYear();

  const datedPosts = apiPosts
    .map((post, index) => {
      const createdRaw = post.createdTime || post.created_time;
      const createdDate = new Date(createdRaw);
      if (!createdRaw || Number.isNaN(createdDate.getTime())) {
        return null;
      }

      if (createdDate.getFullYear() >= currentYear) {
        return null;
      }

      const targetDate = new Date(createdDate.getFullYear(), today.getMonth(), today.getDate());
      const postDateOnly = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
      const daysInYear = new Date(createdDate.getFullYear(), 1, 29).getMonth() === 1 ? 366 : 365;
      let dayDelta = Math.round((postDateOnly.getTime() - targetDate.getTime()) / 86400000);

      // Wrap near year boundaries so Dec/Jan posts can still count as close matches.
      if (dayDelta > daysInYear / 2) {
        dayDelta -= daysInYear;
      } else if (dayDelta < -daysInYear / 2) {
        dayDelta += daysInYear;
      }

      const absDayDelta = Math.abs(dayDelta);
      if (absDayDelta > 7) {
        return null;
      }

      const firstMedia = Array.isArray(post.media) ? post.media.find((media) => media && (media.imageUrl || media.image_url || media.previewUrl || media.preview_url)) : null;
      const imageUrl = firstMedia ? (firstMedia.imageUrl || firstMedia.image_url || firstMedia.previewUrl || firstMedia.preview_url) : '';

      return {
        key: `${post.id || index}`,
        title: post.message || post.story || firstMedia?.title || `Facebook post from ${createdDate.getFullYear()}`,
        date: createdDate,
        year: createdDate.getFullYear(),
        dayDelta,
        absDayDelta,
        permalinkUrl: post.permalinkUrl || post.permalink_url || 'https://www.facebook.com/nomadcyclingclub',
        imageUrl,
        alt: firstMedia?.title || 'Facebook post image'
      };
    })
    .filter(Boolean);

  const matches = [...datedPosts]
    .sort((left, right) => {
      if (left.absDayDelta !== right.absDayDelta) {
        return left.absDayDelta - right.absDayDelta;
      }
      if (left.year !== right.year) {
        return right.year - left.year;
      }
      return right.date.getTime() - left.date.getTime();
    })
    .slice(0, 24);

  if (matches.length === 0) {
    section.innerHTML = `
      <div class="archive-empty">
        <strong>No archived posts within +/- 7 days of ${memoryDate} yet.</strong>
        <p>When more historical posts are available around today's date, they will appear here.</p>
      </div>
    `;
    return;
  }

  const hasExactMatch = matches.some((item) => item.dayDelta === 0);
  if (label) {
    label.textContent = `${hasExactMatch ? 'On this day' : 'Within +/- 7 days'} · ${memoryDate}`;
  }

  section.innerHTML = matches.map((item, index) => {
    const deltaLabel = item.dayDelta === 0
      ? 'Exact day match'
      : `${item.dayDelta > 0 ? '+' : ''}${item.dayDelta} day${Math.abs(item.dayDelta) === 1 ? '' : 's'} from ${memoryDate}`;

    return `
    <article class="memory-item on-this-day-stack-item" style="z-index:${matches.length - index};">
      ${item.imageUrl
        ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.alt)}" loading="lazy" />`
        : '<div class="memory-item-no-image">Post</div>'}
      <div class="memory-copy">
        <h4><a class="home-feed-text-link" href="${escapeHtml(item.permalinkUrl)}" target="_blank" rel="noreferrer">${escapeHtml(item.title)}</a></h4>
        <p>${formatDateTime(item.date.toISOString())}</p>
        <p class="memory-delta">${deltaLabel}</p>
      </div>
    </article>
  `;
  }).join('');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function extractImageId(imageUrl) {
  if (!imageUrl) {
    return '';
  }

  return imageUrl.split('?')[0];
}

function formatDateTime(value) {
  if (!value) {
    return 'Date unavailable';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

async function fetchApiFeedPosts() {
  try {
    const response = await fetch('data/facebook-feed.json', { cache: 'no-store' });
    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    if (!payload || !Array.isArray(payload.posts)) {
      return [];
    }

    return payload.posts;
  } catch {
    return [];
  }
}

function extractCount(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return 0;
  }

  const summaryCount = value.summary?.total_count;
  if (typeof summaryCount === 'number' && Number.isFinite(summaryCount)) {
    return summaryCount;
  }

  const totalCount = value.total_count;
  if (typeof totalCount === 'number' && Number.isFinite(totalCount)) {
    return totalCount;
  }

  return 0;
}

function getPostEngagementCounts(post) {
  const likesCount = Math.max(
    extractCount(post.likeCount),
    extractCount(post.likesCount),
    extractCount(post.reactionsCount),
    extractCount(post.likes),
    extractCount(post.reactions),
    extractCount(post.reaction_count),
    extractCount(post.like_count)
  );

  const commentsLength = Array.isArray(post.comments) ? post.comments.length : 0;
  const commentsCount = Math.max(
    commentsLength,
    extractCount(post.commentCount),
    extractCount(post.commentsCount),
    extractCount(post.comments),
    extractCount(post.comments_count),
    extractCount(post.comment_count)
  );

  return {
    likesCount,
    commentsCount
  };
}

function renderPostComments(post, postIndex, postUrl) {
  const comments = Array.isArray(post.comments) ? post.comments : [];
  const { likesCount, commentsCount } = getPostEngagementCounts(post);

  const visibleComments = comments.slice(0, 3);
  const commentsHtml = visibleComments.map(comment => `
    <div class="comment-item">
      <div class="comment-author">${escapeHtml(comment.from || 'User')}</div>
      <p class="comment-text">${escapeHtml(comment.message || '')}</p>
      <div class="comment-time">${formatDateTime(comment.createdTime)}</div>
    </div>
  `).join('');

  const hiddenCount = Math.max(commentsCount - visibleComments.length, 0);

  const commentInputHtml = `
    <div class="comment-input-form">
      <textarea class="comment-textarea" placeholder="Write a comment..." data-post-index="${postIndex}"></textarea>
      <button class="comment-submit-btn" data-post-index="${postIndex}" data-post-id="${escapeHtml(post.id || '')}">Post</button>
    </div>
  `;

  return `
    <div class="post-comments-section">
      <div class="post-engagement-summary">
        <span>${likesCount} like${likesCount !== 1 ? 's' : ''}</span>
        <span>${commentsCount} comment${commentsCount !== 1 ? 's' : ''}</span>
      </div>
      <div class="post-actions-row">
        <button class="comment-action-btn" type="button">Like</button>
        <button class="comment-action-btn comment-focus-btn" type="button" data-post-index="${postIndex}">Comment</button>
        <a class="comment-action-link" href="${escapeHtml(postUrl)}" target="_blank" rel="noreferrer">Share</a>
      </div>
      ${hiddenCount > 0 ? `<p class="more-comments-note">View ${hiddenCount} more on Facebook</p>` : ''}
      ${commentsHtml}
      <div id="loginToComment-${postIndex}" class="login-to-comment">
        <button class="comment-login-trigger" type="button" data-post-index="${postIndex}" data-post-url="${escapeHtml(postUrl)}">Log in with Facebook to comment</button>
      </div>
      <div id="commentForm-${postIndex}" style="display: none;">
        ${commentInputHtml}
      </div>
    </div>
  `;
}

async function renderApiHomeFeedPosts(container) {
  const apiPosts = await fetchApiFeedPosts();
  if (apiPosts.length === 0) {
    return false;
  }

  const clubAvatar = 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/434604830_1029036748669316_4381808470709969180_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=wq6mCRo7vpIQ7kNvwHIVhPS&_nc_oc=Ado4Ht_3AIz3aO1db-EVOdfN-qkfL3TCPq8taQVZkyQ7dVnBfr7e9iDzd4ak1kjYHAg&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=42QPR6HS6egX18UFG_KD8g&_nc_ss=7b2a8&oh=00_Af7ow7NgPBFrQEn-u9g6Gon4xNzTwNI_Mn4qC4PcXEMyPA&oe=6A080E03';
  const lightboxPhotos = [];

  container.innerHTML = apiPosts.slice(0, 10).map((post, postIndex) => {
    const postUrl = post.permalinkUrl || post.permalink_url || 'https://www.facebook.com/nomadcyclingclub';
    const message = post.message || post.story || `Facebook post ${postIndex + 1}`;
    const postedAt = formatDateTime(post.createdTime || post.created_time);
    const mediaList = Array.isArray(post.media) ? post.media : [];
    const normalizedMedia = mediaList.map((media) => ({
      type: String(media.type || '').toLowerCase(),
      imageUrl: media.imageUrl || media.image_url || media.previewUrl || media.preview_url || '',
      videoUrl: media.videoUrl || media.video_url || media.sourceUrl || media.source_url || '',
      targetUrl: media.targetUrl || media.target_url || ''
    }));

    // Original deduplication: avoid duplicate videos and images
    const seenUrls = new Set();
    const videoPosterSet = new Set();
    const dedupedMedia = [];

    for (const media of normalizedMedia) {
      const videoKey = `video:${media.videoUrl}`;
      const imageKey = `image:${extractImageId(media.imageUrl)}`;

      if (media.type === 'video' && media.videoUrl) {
        // Add video if not already seen
        if (!seenUrls.has(videoKey)) {
          dedupedMedia.push(media);
          seenUrls.add(videoKey);
          if (media.imageUrl) {
            videoPosterSet.add(extractImageId(media.imageUrl));
          }
        }
      } else if (media.imageUrl) {
        // Add photo/album if not already seen AND not a video poster
        if (!seenUrls.has(imageKey) && !videoPosterSet.has(extractImageId(media.imageUrl))) {
          dedupedMedia.push(media);
          seenUrls.add(imageKey);
        }
      }
    }

    // Additional filter: remove album types if photos with same image exist
    const photoImageUrls = new Set();
    dedupedMedia.forEach((m) => {
      if (m.type === 'photo' && m.imageUrl) {
        photoImageUrls.add(extractImageId(m.imageUrl));
      }
    });

    const displayMedia = dedupedMedia.filter((media) => {
      // Remove album if it has same image as a photo
      if (media.type === 'album' && photoImageUrls.has(extractImageId(media.imageUrl))) {
        return false;
      }
      return true;
    });

    const hasVideo = displayMedia.some((media) => media.type === 'video' && media.videoUrl);
    const finalDisplayMedia = hasVideo
      ? displayMedia.filter((media) => media.type === 'video' && media.videoUrl)
      : displayMedia.filter((media) => media.type === 'photo' || media.type === 'video');

    const mediaHtml = finalDisplayMedia.map((media, mediaIndex) => {
      const mediaType = media.type;
      const imageUrl = media.imageUrl;
      const videoUrl = media.videoUrl;
      const isReel = /\/reel\//i.test(postUrl) || /reel/i.test(mediaType) || /\/reel\//i.test(media.targetUrl || '');
      const mediaAlt = escapeHtml(message || `Post media ${mediaIndex + 1}`);

      if (mediaType === 'video') {
        if (videoUrl) {
          return `
            <div class="home-feed-video${isReel ? ' home-feed-video-reel' : ''}">
              <video controls preload="metadata" ${imageUrl ? `poster="${escapeHtml(imageUrl)}"` : ''}>
                <source src="${escapeHtml(videoUrl)}" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          `;
        }

        if (imageUrl) {
          return `
            <a class="home-feed-video-link" href="${escapeHtml(postUrl)}" target="_blank" rel="noreferrer">
              <img src="${escapeHtml(imageUrl)}" alt="${mediaAlt}" loading="lazy" />
              <span>Watch on Facebook</span>
            </a>
          `;
        }

        return '';
      }

      if (!imageUrl) {
        return '';
      }

      const lightboxIndex = lightboxPhotos.length;
      lightboxPhotos.push({
        src: imageUrl,
        bestSrc: imageUrl,
        alt: media.title || message || `Facebook media ${lightboxIndex + 1}`,
        title: post.title || 'Facebook post',
        date: post.createdTime || post.created_time || null,
        postText: message,
        candidateSrcs: [imageUrl]
      });

      return `
        <button class="feed-media-trigger" type="button" data-lightbox-index="${lightboxIndex}" aria-label="Open post image ${mediaIndex + 1}">
          <img src="${escapeHtml(imageUrl)}" alt="${mediaAlt}" loading="lazy" />
        </button>
      `;
    }).join('');

    return `
      <article class="home-feed-post">
        <div class="post-header">
          <div class="post-avatar">
            <img src="${clubAvatar}" alt="Nomad Cycling Club" loading="lazy" />
          </div>
          <div class="post-info">
            <h3>Nomad Cycling Club - USA</h3>
            <span class="post-time">${escapeHtml(postedAt)}</span>
          </div>
        </div>
        <div class="home-feed-body">
          <p class="home-feed-text"><a class="home-feed-text-link" href="${escapeHtml(postUrl)}" target="_blank" rel="noreferrer">${escapeHtml(message)}</a></p>
          ${mediaHtml ? `<div class="home-feed-photo-grid ${hasVideo ? 'home-feed-photo-grid-video' : ''}">${mediaHtml}</div>` : ''}
          <div class="home-feed-footer"><a href="${escapeHtml(postUrl)}" target="_blank" rel="noreferrer">Open original Facebook post</a></div>
          ${renderPostComments(post, postIndex, postUrl)}
        </div>
      </article>
    `;
  }).join('');

  const triggers = container.querySelectorAll('.feed-media-trigger[data-lightbox-index]');
  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const index = Number(trigger.getAttribute('data-lightbox-index'));
      if (Number.isNaN(index)) {
        return;
      }

      galleryPhotosForView = lightboxPhotos;
      ensureGalleryLightbox();
      openLightbox(index);
    });
  });

  // Check if user is logged in and show/hide comment forms accordingly
  if (window.FB) {
    FB.getLoginStatus((response) => {
      if (response.status === 'connected') {
        showCommentForms();
      } else {
        hideCommentForms();
      }
    });
  }

  setupCommentLoginHandlers();
  setupCommentFocusHandlers();

  return true;
}

async function renderFallbackHomeFeedPosts(container) {
  const clubAvatar = 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/434604830_1029036748669316_4381808470709969180_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=wq6mCRo7vpIQ7kNvwHIVhPS&_nc_oc=Ado4Ht_3AIz3aO1db-EVOdfN-qkfL3TCPq8taQVZkyQ7dVnBfr7e9iDzd4ak1kjYHAg&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=42QPR6HS6egX18UFG_KD8g&_nc_ss=7b2a8&oh=00_Af7ow7NgPBFrQEn-u9g6Gon4xNzTwNI_Mn4qC4PcXEMyPA&oe=6A080E03';

  const displayPhotos = await getDisplayPhotos();
  const recentFirst = [...displayPhotos].sort((left, right) => {
    if (left.date && right.date) {
      return right.date.localeCompare(left.date);
    }

    if (left.date) {
      return -1;
    }

    if (right.date) {
      return 1;
    }

    return 0;
  });

  const posts = recentFirst.slice(0, 6);
  if (posts.length === 0) {
    container.innerHTML = '<p class="archive-empty">No feed items are available right now.</p>';
    return;
  }

  container.innerHTML = posts.map((photo, index) => `
    <article class="home-feed-post">
      <div class="post-header">
        <div class="post-avatar">
          <img src="${clubAvatar}" alt="Nomad Cycling Club" loading="lazy" />
        </div>
        <div class="post-info">
          <h3>Nomad Cycling Club - USA</h3>
          <span class="post-time">${formatLongDate(photo.date)}</span>
        </div>
      </div>
      <div class="home-feed-body">
        <p class="home-feed-text"><a class="home-feed-text-link" href="${getPhotoPostUrl(photo)}" target="_blank" rel="noreferrer">${getPhotoPostText(photo, index)}</a></p>
        <div class="home-feed-photo">
          <button class="feed-media-trigger" type="button" data-feed-index="${index}" aria-label="Open post image ${index + 1}">
            <img src="${photo.bestSrc || photo.src}" alt="${photo.alt || 'Club archive photo'}" loading="lazy" />
          </button>
        </div>
        <div class="home-feed-footer">${photo.title || `Post ${index + 1}`}</div>
      </div>
    </article>
  `).join('');

  const feedPhotos = posts.map((photo) => ({
    ...photo,
    candidateSrcs: photo.candidateSrcs || [photo.bestSrc || photo.src]
  }));

  const triggers = container.querySelectorAll('.feed-media-trigger[data-feed-index]');
  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const index = Number(trigger.getAttribute('data-feed-index'));
      if (Number.isNaN(index)) {
        return;
      }

      galleryPhotosForView = feedPhotos;
      ensureGalleryLightbox();
      openLightbox(index);
    });
  });
}

async function renderHomeFeedPosts() {
  const container = document.getElementById('homeFeedPosts');
  if (!container) {
    return;
  }

  const renderedApiFeed = await renderApiHomeFeedPosts(container);
  if (!renderedApiFeed) {
    await renderFallbackHomeFeedPosts(container);
  }
}

let pinnedEventCountdownInterval = null;

function parseFacebookDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  const normalized = dateString.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatPinnedEventDate(startTime, endTime) {
  const start = parseFacebookDate(startTime);
  if (!start) {
    return '';
  }

  const datePart = start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const timePart = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  let label = timePart === '12:00 AM' ? datePart : `${datePart} · ${timePart}`;

  const end = parseFacebookDate(endTime);
  if (end) {
    const sameDay = start.toDateString() === end.toDateString();
    if (sameDay) {
      label += ` - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else {
      label += ` - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
  }

  return label;
}

function formatCountdownLabel(startDate) {
  const diffMs = startDate.getTime() - Date.now();
  if (diffMs <= 0) {
    return 'Started';
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

async function renderPinnedUpcomingEvent() {
  const container = document.getElementById('pinnedUpcomingEvent');
  if (!container) {
    return;
  }

  if (pinnedEventCountdownInterval) {
    clearInterval(pinnedEventCountdownInterval);
    pinnedEventCountdownInterval = null;
  }

  let data;
  try {
    const response = await fetch('data/facebook-events.json');
    if (!response.ok) {
      throw new Error('Unable to load events');
    }
    data = await response.json();
  } catch {
    container.innerHTML = '<p class="upcoming-pin-empty">Could not load upcoming events. <a href="https://www.facebook.com/nomadcyclingclub/events" target="_blank" rel="noopener">Check Facebook</a>.</p>';
    return;
  }

  const upcoming = Array.isArray(data.upcoming) ? data.upcoming : [];
  const nextEvent = upcoming
    .filter((event) => !event.isCanceled && parseFacebookDate(event.startTime))
    .sort((left, right) => parseFacebookDate(left.startTime) - parseFacebookDate(right.startTime))[0];

  if (!nextEvent) {
    container.innerHTML = '<p class="upcoming-pin-empty">No upcoming events right now.</p>';
    return;
  }

  const startDate = parseFacebookDate(nextEvent.startTime);
  const place = nextEvent.place
    ? [nextEvent.place.name, nextEvent.place.city, nextEvent.place.state].filter(Boolean).join(', ')
    : '';
  const coverHtml = nextEvent.coverUrl
    ? `<a href="${nextEvent.eventUrl}" target="_blank" rel="noopener" class="upcoming-pin-cover-link"><img src="${nextEvent.coverUrl}" alt="${nextEvent.name || 'Upcoming event'}" class="upcoming-pin-cover" loading="lazy" /></a>`
    : '';

  container.innerHTML = `
    <div class="upcoming-pin-event">
      ${coverHtml}
      <div class="upcoming-pin-event-head">
        <h3><a href="${nextEvent.eventUrl}" target="_blank" rel="noopener">${nextEvent.name || 'Upcoming Event'}</a></h3>
        <span id="pinnedEventCountdown" class="countdown-badge"></span>
      </div>
      ${startDate ? `<p class="upcoming-pin-date">${formatPinnedEventDate(nextEvent.startTime, nextEvent.endTime)}</p>` : ''}
      ${place ? `<p class="upcoming-pin-place">${place}</p>` : ''}
      <a class="upcoming-pin-link" href="${nextEvent.eventUrl}" target="_blank" rel="noopener">View on Facebook -></a>
    </div>
  `;

  const countdownEl = document.getElementById('pinnedEventCountdown');
  if (!countdownEl || !startDate) {
    return;
  }

  const updateCountdown = () => {
    countdownEl.textContent = formatCountdownLabel(startDate);
  };

  updateCountdown();
  pinnedEventCountdownInterval = setInterval(updateCountdown, 1000);
}

async function renderFbEvents() {
  const upcomingList = document.getElementById('fbEventsUpcomingList');
  const pastList = document.getElementById('fbEventsPastList');
  const pastSection = document.getElementById('fbEventsPast');
  if (!upcomingList) return;

  let data;
  try {
    const res = await fetch('data/facebook-events.json');
    if (!res.ok) throw new Error('Not found');
    data = await res.json();
  } catch {
    upcomingList.innerHTML = '<p class="events-empty">Could not load events from Facebook. Check back soon or <a href="https://www.facebook.com/nomadcyclingclub/events" target="_blank" rel="noopener">view on Facebook</a>.</p>';
    return;
  }

  function formatEventDate(startTime, endTime) {
    if (!startTime) return '';
    const start = new Date(startTime);
    const opts = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    let str = start.toLocaleDateString('en-US', opts);
    const timeOpts = { hour: 'numeric', minute: '2-digit', hour12: true };
    const timeStr = start.toLocaleTimeString('en-US', timeOpts);
    if (timeStr !== '12:00 AM') str += ` · ${timeStr}`;
    if (endTime) {
      const end = new Date(endTime);
      const sameDay = start.toDateString() === end.toDateString();
      if (sameDay) {
        str += ` – ${end.toLocaleTimeString('en-US', timeOpts)}`;
      } else {
        str += ` – ${end.toLocaleDateString('en-US', opts)}`;
      }
    }
    return str;
  }

  function renderEventCard(event, isPast) {
    const dateStr = formatEventDate(event.startTime, event.endTime);
    const place = event.place
      ? [event.place.name, event.place.city, event.place.state].filter(Boolean).join(', ')
      : '';
    const canceledBadge = event.isCanceled ? '<span class="event-badge event-badge--canceled">Canceled</span>' : '';
    const coverHtml = event.coverUrl
      ? `<a href="${event.eventUrl}" target="_blank" rel="noopener" class="event-cover-link">
           <img src="${event.coverUrl}" alt="${event.name || ''}" class="event-cover" loading="lazy" />
         </a>`
      : '';
    const descHtml = event.description
      ? `<p class="event-description">${event.description.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</p>`
      : '';

    return `<div class="fb-event-card${isPast ? ' fb-event-card--past' : ''}">
      ${coverHtml}
      <div class="fb-event-info">
        <div class="fb-event-header">
          <h3 class="fb-event-name"><a href="${event.eventUrl}" target="_blank" rel="noopener">${event.name || 'Event'}</a></h3>
          ${canceledBadge}
        </div>
        ${dateStr ? `<p class="fb-event-date"><svg class="event-icon" viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/></svg> ${dateStr}</p>` : ''}
        ${place ? `<p class="fb-event-place"><svg class="event-icon" viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M8 0a5 5 0 0 0-5 5c0 3.5 5 11 5 11s5-7.5 5-11a5 5 0 0 0-5-5zm0 7.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg> ${place}</p>` : ''}
        ${descHtml}
        <a class="fb-event-link" href="${event.eventUrl}" target="_blank" rel="noopener">View on Facebook →</a>
      </div>
    </div>`;
  }

  const upcoming = Array.isArray(data.upcoming) ? data.upcoming : [];
  const past = Array.isArray(data.past) ? data.past : [];

  if (upcoming.length === 0) {
    upcomingList.innerHTML = '<p class="events-empty">No upcoming events at the moment. <a href="https://www.facebook.com/nomadcyclingclub/events" target="_blank" rel="noopener">Check Facebook</a> for the latest.</p>';
  } else {
    upcomingList.innerHTML = upcoming.map(e => renderEventCard(e, false)).join('');
  }

  if (past.length > 0 && pastSection && pastList) {
    pastSection.style.display = '';
    pastList.innerHTML = past.slice(0, 6).map(e => renderEventCard(e, true)).join('');
  }
}

async function initializeDynamicSections() {
  await Promise.all([
    renderPinnedUpcomingEvent(),
    renderGallery(),
    renderHomePreview(),
    renderOnThisDay(),
    renderHomeFeedPosts(),
    renderFbEvents()
  ]);
}

initializeDynamicSections();

const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    alert('This contact form is a placeholder. Please email support@nomadcyclingclub.com to reach the club.');
  });
}

// Facebook SDK and Interactive Posting
const FB_APP_ID = '514212502254865';
const FB_PAGE_ID = '514212502254865';
const FB_LOGIN_ENABLED = /^\d{6,}$/.test(FB_APP_ID) && FB_APP_ID !== FB_PAGE_ID;

function openFacebookCommentFallback(postUrl) {
  const targetUrl = postUrl || 'https://www.facebook.com/nomadcyclingclub';
  window.open(targetUrl, '_blank', 'noopener');
}

window.fbAsyncInit = function() {
  if (!FB_LOGIN_ENABLED) {
    hideCommentForms();
    return;
  }

  FB.init({
    appId: FB_APP_ID,
    xfbml: true,
    version: 'v19.0'
  });

  FB.getLoginStatus(function(response) {
    handleLoginStatusChange(response);
  });
};

function handleLoginStatusChange(response) {
  const loginSection = document.getElementById('fbLoginSection');
  const composer = document.getElementById('fbPostComposer');

  // Gallery page doesn't have these elements, so check before accessing
  if (!loginSection || !composer) {
    return;
  }

  if (response.status === 'connected') {
    loginSection.style.display = 'none';
    composer.style.display = 'block';
    showCommentForms();
  } else {
    loginSection.style.display = 'block';
    composer.style.display = 'none';
    hideCommentForms();
  }
}

function showCommentForms() {
  const commentForms = document.querySelectorAll('[id^="commentForm-"]');
  const loginToCommentElems = document.querySelectorAll('[id^="loginToComment-"]');

  commentForms.forEach(form => {
    form.style.display = 'block';
  });

  loginToCommentElems.forEach(elem => {
    elem.style.display = 'none';
  });

  setupCommentSubmitHandlers();
  setupCommentFocusHandlers();
}

function hideCommentForms() {
  const commentForms = document.querySelectorAll('[id^="commentForm-"]');
  const loginToCommentElems = document.querySelectorAll('[id^="loginToComment-"]');

  commentForms.forEach(form => {
    form.style.display = 'none';
  });

  loginToCommentElems.forEach(elem => {
    elem.style.display = 'block';
  });

  setupCommentLoginHandlers();
  setupCommentFocusHandlers();
}

function setupCommentLoginHandlers() {
  const loginButtons = document.querySelectorAll('.comment-login-trigger');
  loginButtons.forEach((button) => {
    if (button.classList.contains('comment-login-listener-attached')) {
      return;
    }

    if (!FB_LOGIN_ENABLED) {
      button.textContent = 'Comment on Facebook';
    }

    button.classList.add('comment-login-listener-attached');
    button.addEventListener('click', (event) => {
      const postUrl = button.getAttribute('data-post-url') || 'https://www.facebook.com/nomadcyclingclub';

      if (!FB_LOGIN_ENABLED || !window.FB) {
        event.preventDefault();
        openFacebookCommentFallback(postUrl);
        return;
      }

      FB.login((response) => {
        handleLoginStatusChange(response);
      }, { scope: 'public_profile,pages_read_engagement,pages_manage_posts,pages_manage_engagement' });
    });
  });
}

function setupCommentFocusHandlers() {
  const focusButtons = document.querySelectorAll('.comment-focus-btn');
  focusButtons.forEach((button) => {
    if (button.classList.contains('comment-focus-listener-attached')) {
      return;
    }

    button.classList.add('comment-focus-listener-attached');
    button.addEventListener('click', () => {
      const postIndex = button.getAttribute('data-post-index');
      const textarea = document.querySelector(`.comment-textarea[data-post-index="${postIndex}"]`);
      const loginTrigger = document.querySelector(`.comment-login-trigger[data-post-index="${postIndex}"]`);

      if (textarea && textarea.offsetParent !== null) {
        textarea.focus();
        return;
      }

      if (loginTrigger) {
        loginTrigger.click();
      }
    });
  });
}

function setupCommentSubmitHandlers() {
  const submitBtns = document.querySelectorAll('.comment-submit-btn');
  submitBtns.forEach((btn) => {
    if (btn.classList.contains('comment-listener-attached')) {
      return;
    }

    btn.classList.add('comment-listener-attached');
    btn.addEventListener('click', function() {
      const postIndex = this.getAttribute('data-post-index');
      const postId = this.getAttribute('data-post-id');
      const textarea = document.querySelector(`[data-post-index="${postIndex}"].comment-textarea`);

      if (!textarea) {
        return;
      }

      const message = textarea.value.trim();
      if (!message) {
        alert('Please enter a comment');
        return;
      }

      this.disabled = true;
      this.textContent = 'Posting...';

      FB.api(`/${postId}/comments`, 'POST', { message: message }, (response) => {
        this.disabled = false;
        this.textContent = 'Post';

        if (response.error) {
          alert(`Error: ${response.error.message}`);
        } else {
          textarea.value = '';
          alert('Comment posted successfully!');
          // Refresh the feed to show the new comment
          renderHomeFeedPosts();
        }
      });
    });
  });
}

document.getElementById('fbLoginBtn')?.addEventListener('click', function() {
  if (!FB_LOGIN_ENABLED || !window.FB) {
    openFacebookCommentFallback('https://www.facebook.com/nomadcyclingclub');
    return;
  }

  FB.login(function(response) {
    handleLoginStatusChange(response);
  }, { scope: 'public_profile,pages_read_engagement,pages_manage_posts,pages_manage_engagement' });
});

document.getElementById('fbLogoutBtn')?.addEventListener('click', function() {
  FB.logout(function(response) {
    handleLoginStatusChange(response);
  });
});

document.getElementById('submitPostBtn')?.addEventListener('click', function() {
  if (!FB_LOGIN_ENABLED || !window.FB) {
    alert('Facebook app login is not configured yet. Please post directly on the Facebook page.');
    return;
  }

  const message = document.getElementById('postMessage')?.value || '';
  const statusEl = document.getElementById('postStatus');
  const submitBtn = document.getElementById('submitPostBtn');

  if (!message.trim()) {
    statusEl.textContent = 'Please enter a message';
    statusEl.classList.add('error');
    return;
  }

  submitBtn.disabled = true;
  statusEl.textContent = 'Posting...';
  statusEl.classList.remove('success', 'error');

  FB.api(`/${FB_PAGE_ID}/feed`, 'POST', { message: message }, function(response) {
    submitBtn.disabled = false;

    if (response.error) {
      statusEl.textContent = `Error: ${response.error.message}`;
      statusEl.classList.add('error');
    } else {
      statusEl.textContent = 'Posted successfully!';
      statusEl.classList.add('success');
      document.getElementById('postMessage').value = '';

      setTimeout(() => {
        statusEl.textContent = '';
        statusEl.classList.remove('success', 'error');
        renderHomeFeedPosts();
      }, 2000);
    }
  });
});

(function(d, s, id) {
  if (!FB_LOGIN_ENABLED) return;
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v19.0&appId=" + FB_APP_ID;
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
