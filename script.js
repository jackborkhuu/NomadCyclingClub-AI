const navToggle = document.getElementById('navToggle');
const siteNav = document.getElementById('siteNav');

navToggle?.addEventListener('click', () => {
  siteNav?.classList.toggle('open');
});

const facebookPhotos = [
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/473013051_2432302783779151_4367558447526915791_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=2a1932&_nc_ohc=2DqLnHDwqkgQ7kNvwGxpYY7&_nc_oc=Adro7iJVgVzbq6SummMGUmd68gYFfSryVKi0FvQyLcHsley_MQ9IUaiKhHRoJSAXbNM&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=jdN_sHT-EBAAJIJ0ZC0gQw&_nc_ss=7b2a8&oh=00_Af4AybgHrTogoWi73qF3KoKxrGtlG4YxKye0jXJBKnW3Jg&oe=6A07E6B7',
    alt: 'Nomad Cycling Club cover ride',
    title: 'Cover ride',
    date: '2022-08-15'
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/673625921_1637213444518307_5611692299590495681_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=107&ccb=1-7&_nc_sid=7b2446&_nc_ohc=XMCWLhA7ivMQ7kNvwF6Gpzm&_nc_oc=AdrVVEfwaswkK9-vdH-3nm3ubNRZFok2XB_UpDP1rUBH1083_RK93o1YBkqy-L0e_8Y&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=_c4g0HlUc6xXnNHQukpKWg&_nc_ss=7b289&oh=00_Af4qtLpypEaDcDQMfOzvUTaTUDfzEUONQx6_uSLj5S6abg&oe=6A07F72F',
    alt: 'Club ride archive photo 1',
    title: 'Facebook archive photo',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/672683099_1637213437851641_7228904326571331058_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=7b2446&_nc_ohc=DijEINDBPKEQ7kNvwFzFeHh&_nc_oc=AdpoDMg1Vg_eVVf7-HZq7koRuc3WnMAsWU4esNWoUT0bGDn6np5eB3uww4midIJQzdw&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=NWIyd6DrgIWed5MMBMmwcQ&_nc_ss=7b289&oh=00_Af4gSwCPnb8waySHAeGh1YkMCUu6638_4lrHEAJ_uMRucA&oe=6A07FE31',
    alt: 'Club ride archive photo 2',
    title: 'Facebook archive photo',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/673535871_1637213414518310_7903495935145392462_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=7b2446&_nc_ohc=RhRRNJswA_cQ7kNvwEt9qUa&_nc_oc=AdpmouZtIJ5_2j_kpq8UyejV_hi3o75kUpSVoztm0dWCX5rX95X_ua2d2cg1uc5Z3ns&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=o5lQXyqyrQhUhTytC4-GPQ&_nc_ss=7b289&oh=00_Af4xx4qztXjiOQYBJZL3bhksStJDgZG9BQbtvvb_JTs3KA&oe=6A082523',
    alt: 'Club ride archive photo 3',
    title: 'Facebook archive photo',
    date: null
  },
  {
    src: 'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/672643464_1637213431184975_1515063720095141462_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=101&ccb=1-7&_nc_sid=7b2446&_nc_ohc=S5ej16cRdd0Q7kNvwF7nFKF&_nc_oc=AdpjQp1ODCxCeNe92ZhbUFlVilB6RylOAk2SWSQ-T3bkqQkMIy-NId9NHxc16VLAn7o&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=k2TvIU6P3CB7tdS2ms1OcA&_nc_ss=7b289&oh=00_Af6t_gQ2jfecFcHqCDJMNVLGmrRoNwimq5jQQThsg41VRg&oe=6A0804D3',
    alt: 'Club ride archive photo 4',
    title: 'Facebook archive photo',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/607950584_1545940523645600_7370249189459747437_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=7b2446&_nc_ohc=d6r2XKgz5rMQ7kNvwGk8-1y&_nc_oc=AdpjDo1UMJrXMBi-tKlU_OtK1_fCpjbvGEBcM2KS1cIApzUh5i4V67NqbbRV3odCBFo&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=xXbmXiK1g5tdOokut_nY5Q&_nc_ss=7b289&oh=00_Af6xLmyeY1jqfkqI01Dwie20bI3UPJsJVFnoaVJb1zIAEw&oe=6A080B06',
    alt: 'Club archive photo from the Facebook page',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/574390030_1493128615593458_7589757113301233912_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=7b2446&_nc_ohc=ZwoZNMuZ1I4Q7kNvwFbCWER&_nc_oc=AdpPHgE9PoqdPRQxfoMcEp6mcAs7Fq57h5dYXMeVCu3OpSu9lJPKQalsLMNeIKDhrpc&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=zBF5CE0pd4GuczGwTD74Mw&_nc_ss=7b289&oh=00_Af5Na7dsqTqQQAdDimg7alm8LrwfzUsD_2_hUl8cO36pVg&oe=6A07FF8E',
    alt: 'Club archive photo from November 2, 2025',
    title: 'Archive ride',
    date: '2025-11-02'
  },
  {
    src: 'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/573891801_1493128602260126_3070074279857641340_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=7b2446&_nc_ohc=V0sg0KEHtkMQ7kNvwGp9jLL&_nc_oc=Adq9Kxze8BQg4cyfgal0fQA7CCvTgwyD8LXPBiLHB8bG0I7j59j0aly6O0Kaa0Vpbj8&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=q-CNl_Bml224eZYcua3bNw&_nc_ss=7b289&oh=00_Af4ydW-cSJU6zA6_VzAQ2KigcaQyso9OzajElZPJkxZXSw&oe=6A080FA1',
    alt: 'Club archive photo from November 2, 2025',
    title: 'Archive ride',
    date: '2025-11-02'
  },
  {
    src: 'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/574034432_1493128632260123_628460640214557466_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=7b2446&_nc_ohc=kOq_sVn1SxkQ7kNvwHthGr2&_nc_oc=Adp71Hgw2Vj_Cl_AwY9kiOT-5B1neOGyB3RkGJecW57Ry4MoqgaZeusXepwuU4mccxs&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=x6Pw0DqOsUEBKNs-4lteWQ&_nc_ss=7b289&oh=00_Af7zH3CPeEUYgzHxSwUDr8fHp08BT6vWvlvojU3x7JPFag&oe=6A07FFC2',
    alt: 'Club archive photo from November 2, 2025',
    title: 'Archive ride',
    date: '2025-11-02'
  },
  {
    src: 'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/573374469_1493127725593547_5547752852223608786_n.jpg?stp=c210.0.540.540a_dst-jpg_s206x206_tt6&_nc_cat=104&ccb=1-7&_nc_sid=5df8b4&_nc_ohc=E80XUI34XBgQ7kNvwHomNbr&_nc_oc=AdqP6Ys04WIf7auSNA6RrWSRSP-q8dQ_3DsfBBxOFLewgA03QEbUdDpHR7YYaKyzFxU&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=jE_fGkkO9VHC49CdFQBBLg&_nc_ss=7b289&oh=00_Af74zWFLkYGdJzXVdURC4jEUtq7c3ToRE2v3O5UpubkbbQ&oe=6A07FF4A',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea1-1.xx.fbcdn.net/v/t39.30808-6/576469767_1493128565593463_8311896667144904990_n.jpg?stp=c0.169.1536.1536a_dst-jpg_s206x206_tt6&_nc_cat=101&ccb=1-7&_nc_sid=5df8b4&_nc_ohc=J5tQRiuUE_IQ7kNvwHjr0sz&_nc_oc=AdoffP_fFJgM_W3och8QHosk7BgYUemSCft5hbZZE6AdZcj__RHEJLPiyy9Rt4qFbDg&_nc_zt=23&_nc_ht=scontent-sea1-1.xx&_nc_gid=jE_fGkkO9VHC49CdFQBBLg&_nc_ss=7b289&oh=00_Af5uua2R8yKT7UOerxgV_Ahrf__dNcsCnWs3xtwcDxwzug&oe=6A07FBC9',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/573923631_1493128558926797_956038550251571563_n.jpg?stp=c256.0.1536.1536a_dst-jpg_s206x206_tt6&_nc_cat=105&ccb=1-7&_nc_sid=5df8b4&_nc_ohc=RDxdHpZ3H2oQ7kNvwFZQYV_&_nc_oc=AdpLyDOYSCiTDrrWPeWbZjPEa5DrOKv0P-e2qOxSpQOFzk4Z_-2kdJ8tVCd72NdGpEg&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=jE_fGkkO9VHC49CdFQBBLg&_nc_ss=7b289&oh=00_Af6f5bCM3z04ty-6hlzFfHYB8sChapuhe-03bGM2GOpIaw&oe=6A07FA2A',
    alt: 'Club archive photo',
    title: 'Archive ride',
    date: null
  },
  {
    src: 'https://scontent-sea5-1.xx.fbcdn.net/v/t39.30808-6/549715556_1448003536772633_4648318552302692281_n.jpg?stp=c164.0.992.992a_cp6_dst-jpg_s206x206_tt6&_nc_cat=110&ccb=1-7&_nc_sid=5df8b4&_nc_ohc=1zx0SHMnaHAQ7kNvwEfjHyt&_nc_oc=AdqY67gtvMXMd5Xp_y2YusdDgNHbhnXF74YIt9SPDblbJQaQ5oJMXB3C4lRvwT1YSYI&_nc_zt=23&_nc_ht=scontent-sea5-1.xx&_nc_gid=jE_fGkkO9VHC49CdFQBBLg&_nc_ss=7b289&oh=00_Af5pTn1tCNETqeR-o_KhD_jGCUzgsHn9FQOaI3MOKNK_9w&oe=6A0800FC',
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

let galleryPhotosForView = [];
let activePhotoIndex = 0;

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

  image.src = photo.src;
  image.alt = photo.alt || 'Club gallery photo';
  title.textContent = photo.title || `Photo ${activePhotoIndex + 1}`;
  meta.textContent = `${formatLongDate(photo.date)} • ${activePhotoIndex + 1} / ${total}`;
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

function setupGalleryLightbox() {
  const gallery = document.getElementById('randomGallery');
  const lightbox = document.getElementById('galleryLightbox');
  const closeButton = document.getElementById('lightboxClose');
  const previousButton = document.getElementById('lightboxPrev');
  const nextButton = document.getElementById('lightboxNext');

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

function renderGallery() {
  const gallery = document.getElementById('randomGallery');
  if (!gallery) {
    return;
  }

  galleryPhotosForView = shuffle(facebookPhotos);
  gallery.innerHTML = galleryPhotosForView.map((photo, index) => `
    <article class="gallery-card">
      <button class="gallery-trigger" type="button" data-photo-index="${index}" aria-label="Open photo ${index + 1}">
        <img src="${photo.src}" alt="${photo.alt}" loading="lazy" />
      </button>
      <div class="gallery-card-copy">
        <h3>${photo.title || `Photo ${index + 1}`}</h3>
        <p>${formatLongDate(photo.date)}</p>
      </div>
    </article>
  `).join('');
}

function renderHomePreview() {
  const preview = document.getElementById('homePhotoPreview');
  if (!preview) {
    return;
  }

  const randomizedPhotos = shuffle(facebookPhotos).slice(0, 4);
  preview.innerHTML = randomizedPhotos.map((photo) => `
    <img src="${photo.src}" alt="${photo.alt}" loading="lazy" />
  `).join('');
}

function renderOnThisDay() {
  const section = document.getElementById('onThisDaySection');
  const label = document.getElementById('onThisDayLabel');
  if (!section) {
    return;
  }

  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const memoryDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric'
  }).format(today);

  if (label) {
    label.textContent = `On this day · ${memoryDate}`;
  }

  const matches = facebookPhotos.filter((photo) => photo.date && photo.date.slice(5) === `${month}-${day}`);

  if (matches.length === 0) {
    section.innerHTML = `
      <div class="archive-empty">
        <strong>No archived club photos for ${memoryDate} yet.</strong>
        <p>As more Facebook photos are added with matching dates, they will appear here automatically.</p>
      </div>
    `;
    return;
  }

  section.innerHTML = matches.map((photo) => `
    <article class="memory-item">
      <img src="${photo.src}" alt="${photo.alt}" loading="lazy" />
      <div class="memory-copy">
        <h4>${photo.title}</h4>
        <p>${formatLongDate(photo.date)}</p>
      </div>
    </article>
  `).join('');
}

renderGallery();
setupGalleryLightbox();
renderHomePreview();
renderOnThisDay();

const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    alert('This contact form is a placeholder. Please email support@nomadcyclingclub.com to reach the club.');
  });
}
